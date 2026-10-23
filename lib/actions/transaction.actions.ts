"use server";

import { Query } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { parseStringify, decryptId } from "../utils";
import { getLoggedInUser, getUserInfo } from "./user.actions";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_TRANSACTION_COLLECTION_ID: TRANSACTION_COLLECTION_ID,
  APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID,
} = process.env;

type TransferFundsParams = {
  requestId: string;
  senderBankId: string;
  transferType?: "internal" | "external";
  recipientMethod?: "accountNumber" | "shareableId";
  simulatedAccountNumber?: string;
  sharableId?: string;
  email?: string;
  recipientBankName?: string;
  recipientAccountNumber?: string;
  amount: string | number;
  description?: string;
};

type DatabaseClient = Awaited<ReturnType<typeof createAdminClient>>["database"];

type TransferResult = {
  status: boolean;
  message: string;
  uncertain?: boolean;
};

const isNotFoundError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === 404;

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "";

const isNetworkError = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const err = error as {
    message?: unknown;
    code?: unknown;
    cause?: {
      code?: unknown;
      message?: unknown;
    };
  };

  const message = [err.message, err.cause?.message]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  const code = String(err.code ?? err.cause?.code ?? "").toUpperCase();

  const networkCodes = [
    "ECONNRESET",
    "ECONNREFUSED",
    "ECONNABORTED",
    "ETIMEDOUT",
    "UND_ERR_CONNECT_TIMEOUT",
    "UND_ERR_SOCKET",
    "ENOTFOUND",
    "EAI_AGAIN",
  ];

  return (
    networkCodes.includes(code) ||
    [
      "fetch failed",
      "connect timeout",
      "connection timeout",
      "network error",
      "socket hang up",
      "failed to fetch",
      "timed out",
    ].some((phrase) => message.includes(phrase))
  );
};

const validateRequestId = (requestId: string) =>
  typeof requestId === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    requestId,
  );

const getInternalRecipient = async (
  database: DatabaseClient,
  {
    recipientMethod,
    simulatedAccountNumber,
    sharableId,
  }: Pick<
    TransferFundsParams,
    "recipientMethod" | "simulatedAccountNumber" | "sharableId"
  >,
) => {
  let receiverBanks;

  if (recipientMethod === "accountNumber") {
    receiverBanks = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [
        Query.equal("simulatedAccountNumber", simulatedAccountNumber!.trim()),
        Query.limit(2),
      ],
    );
  } else if (recipientMethod === "shareableId") {
    const receiverAccountId = decryptId(sharableId!.trim());

    if (!receiverAccountId) {
      throw new Error("Invalid recipient shareable ID.");
    }

    receiverBanks = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal("accountId", receiverAccountId), Query.limit(2)],
    );
  } else {
    throw new Error("Choose a valid recipient identification method.");
  }

  if (receiverBanks.documents.length === 0) {
    throw new Error("Recipient account was not found.");
  }

  if (receiverBanks.documents.length > 1) {
    throw new Error(
      "This identifier matches multiple accounts. Please contact support.",
    );
  }

  const receiverBank = receiverBanks.documents[0];

  const receiverUser = await getUserInfo({
    userId: receiverBank.userId,
  });

  if (!receiverUser?.email) {
    throw new Error(
      "Recipient account details could not be verified. Please try again.",
    );
  }

  return { receiverBank, receiverUser };
};

const findExistingTransfer = async (
  database: DatabaseClient,
  requestId: string,
) => {
  try {
    return await database.getDocument(
      DATABASE_ID!,
      TRANSACTION_COLLECTION_ID!,
      requestId,
    );
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }

    throw error;
  }
};

const verifyExistingTransfer = (
  existing: Record<string, any>,
  {
    requestId,
    senderBankId,
    transferType,
    recipientBankName,
    recipientAccountNumber,
    amountInNaira,
    currentUserId,
    normalizedEmail,
    note,
    receiverBankId,
  }: {
    requestId: string;
    senderBankId: string;
    transferType: "internal" | "external";
    recipientBankName?: string;
    recipientAccountNumber?: string;
    amountInNaira: number;
    currentUserId: string;
    normalizedEmail: string;
    note: string;
    receiverBankId?: string;
  },
): TransferResult => {
  const sameBaseRequest =
    existing.$id === requestId &&
    existing.senderId === currentUserId &&
    existing.senderBankId === senderBankId &&
    Number(existing.amount) === amountInNaira;

  const sameTransferType =
    transferType === "external"
      ? existing.channel === "external-simulated" &&
        existing.category === "External Transfer" &&
        existing.description?.includes(
          `Destination account: ${recipientAccountNumber}`,
        ) &&
        existing.description?.includes(`Destination bank: ${recipientBankName}`)
      : existing.channel === "online" &&
        existing.category === "Transfer" &&
        existing.receiverBankId === receiverBankId &&
        existing.email?.trim().toLowerCase() === normalizedEmail &&
        existing.description === note;

  if (!sameBaseRequest || !sameTransferType) {
    throw new Error(
      "This request ID belongs to a different transfer. Verify the previous transfer before starting another.",
    );
  }

  return {
    status: true,
    message:
      "This transfer was already completed. No additional funds were deducted.",
  };
};

export const createTransaction = async (
  transaction: CreateTransactionProps,
) => {
  throw new Error("Transactions must be created through transferFunds.");
};

export const getTransactionsByBankId = async ({
  bankId,
}: getTransactionsByBankIdProps) => {
  try {
    if (!bankId?.trim()) {
      return { total: 0, documents: [] };
    }

    const { database } = await createAdminClient();

    const [senderTransactions, receiverTransactions] = await Promise.all([
      database.listDocuments(DATABASE_ID!, TRANSACTION_COLLECTION_ID!, [
        Query.equal("senderBankId", bankId),
      ]),
      database.listDocuments(DATABASE_ID!, TRANSACTION_COLLECTION_ID!, [
        Query.equal("receiverBankId", bankId),
      ]),
    ]);

    const uniqueTransactions = new Map();

    for (const transaction of [
      ...senderTransactions.documents,
      ...receiverTransactions.documents,
    ]) {
      uniqueTransactions.set(transaction.$id, transaction);
    }

    return parseStringify({
      total: uniqueTransactions.size,
      documents: [...uniqueTransactions.values()],
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);

    return { total: 0, documents: [] };
  }
};

const performTransferFunds = async ({
  requestId,
  senderBankId,
  transferType = "internal",
  recipientMethod = "shareableId",
  simulatedAccountNumber,
  sharableId,
  email,
  recipientBankName,
  recipientAccountNumber,
  amount,
  description,
}: TransferFundsParams): Promise<TransferResult> => {
  const currentUser = await getLoggedInUser();

  if (!currentUser?.userId) {
    throw new Error("Please sign in before transferring funds.");
  }

  if (!validateRequestId(requestId)) {
    throw new Error("Invalid transfer request ID.");
  }

  if (!senderBankId?.trim()) {
    throw new Error("Please select a source account.");
  }

  const amountText = String(amount).trim();
  const amountInNaira = Number(amountText);

  if (
    !Number.isFinite(amountInNaira) ||
    amountInNaira <= 0 ||
    !/^\d+(\.\d{1,2})?$/.test(amountText)
  ) {
    throw new Error("Enter a valid transfer amount.");
  }

  const amountInKobo = Math.round(amountInNaira * 100);

  if (!Number.isSafeInteger(amountInKobo) || amountInKobo <= 0) {
    throw new Error("Enter a valid transfer amount.");
  }

  if (!DATABASE_ID || !TRANSACTION_COLLECTION_ID || !BANK_COLLECTION_ID) {
    throw new Error("Appwrite database configuration is incomplete.");
  }

  if (transferType === "internal") {
    if (recipientMethod === "accountNumber") {
      if (!/^\d{10}$/.test(simulatedAccountNumber?.trim() ?? "")) {
        throw new Error("Enter a valid 10-digit HavenTrust account number.");
      }
    } else if (recipientMethod === "shareableId") {
      if (!sharableId?.trim()) {
        throw new Error("Please enter the recipient's shareable ID.");
      }
    } else {
      throw new Error("Choose a valid recipient identification method.");
    }

    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      throw new Error("Enter a valid recipient email address.");
    }
  } else if (transferType === "external") {
    if (!recipientBankName?.trim()) {
      throw new Error("Select the recipient's bank.");
    }

    if (!/^\d{10}$/.test(recipientAccountNumber?.trim() ?? "")) {
      throw new Error("Enter a valid 10-digit external bank account number.");
    }
  } else {
    throw new Error("Choose a valid transfer type.");
  }

  const { database } = await createAdminClient();

  const note = description?.trim() || "Transfer";
  const normalizedEmail = email?.trim().toLowerCase() ?? "";
  const normalizedBankName = recipientBankName?.trim();
  const normalizedExternalAccount = recipientAccountNumber?.trim();

  let receiverBank:
    | Awaited<ReturnType<typeof getInternalRecipient>>["receiverBank"]
    | undefined;

  let receiverUser:
    | Awaited<ReturnType<typeof getInternalRecipient>>["receiverUser"]
    | undefined;

  if (transferType === "internal") {
    const recipient = await getInternalRecipient(database, {
      recipientMethod,
      simulatedAccountNumber,
      sharableId,
    });

    receiverBank = recipient.receiverBank;
    receiverUser = recipient.receiverUser;

    // Reject transfers to the sender's own account first.
    if (receiverBank.userId === currentUser.userId) {
      throw new Error("You cannot transfer funds to your own account.");
    }

    // Only check the email after confirming the recipient is another user.
    if (
      !receiverUser.email ||
      receiverUser.email.trim().toLowerCase() !== normalizedEmail
    ) {
      throw new Error("The recipient email does not match the account.");
    }
  }

  const verificationDetails = {
    requestId,
    senderBankId,
    transferType,
    recipientBankName: normalizedBankName,
    recipientAccountNumber: normalizedExternalAccount,
    amountInNaira,
    currentUserId: currentUser.userId,
    normalizedEmail,
    note,
    receiverBankId: receiverBank?.$id,
  };

  const existing = await findExistingTransfer(database, requestId);

  if (existing) {
    return verifyExistingTransfer(existing, verificationDetails);
  }

  let transactionId: string | undefined;
  let committed = false;

  try {
    const appwriteTransaction = await database.createTransaction({
      ttl: 60,
    });

    transactionId = appwriteTransaction.$id;

    const senderBank = await database.getDocument(
      DATABASE_ID,
      BANK_COLLECTION_ID,
      senderBankId,
      [],
      transactionId,
    );

    if (senderBank.userId !== currentUser.userId) {
      throw new Error("You do not own the selected source account.");
    }

    if (
      senderBank.$id === receiverBank?.$id ||
      (receiverBank && senderBank.userId === receiverBank.userId)
    ) {
      throw new Error("You cannot transfer funds to your own account.");
    }

    const senderBalance = senderBank.simulatedBalance;

    if (!Number.isSafeInteger(senderBalance) || senderBalance < 0) {
      throw new Error(
        "The source account has an invalid simulated balance. Please contact support.",
      );
    }

    if (senderBalance < amountInKobo) {
      throw new Error("Insufficient simulated funds.");
    }

    if (transferType === "external") {
      await database.updateDocument(
        DATABASE_ID,
        BANK_COLLECTION_ID,
        senderBank.$id,
        {
          simulatedBalance: senderBalance - amountInKobo,
        },
        [],
        transactionId,
      );

      await database.createDocument(
        DATABASE_ID,
        TRANSACTION_COLLECTION_ID,
        requestId,
        {
          name: `External transfer to ${normalizedBankName}`,
          description:
            `${note} | Destination account: ${normalizedExternalAccount}` +
            ` | Destination bank: ${normalizedBankName}` +
            " | SIMULATED — no external payment was sent.",
          amount: amountInNaira,
          senderId: senderBank.userId,
          senderBankId: senderBank.$id,
          receiverId: "",
          receiverBankId: "",
          email: currentUser.email,
          channel: "external-simulated",
          category: "External Transfer",
        },
        [],
        transactionId,
      );
    } else {
      if (!receiverBank || !receiverUser) {
        throw new Error("Recipient account was not found.");
      }

      const transactionalReceiver = await database.getDocument(
        DATABASE_ID,
        BANK_COLLECTION_ID,
        receiverBank.$id,
        [],
        transactionId,
      );

      if (transactionalReceiver.userId !== receiverBank.userId) {
        throw new Error(
          "The recipient account changed. Please verify the recipient and try again.",
        );
      }

      const receiverBalance = transactionalReceiver.simulatedBalance;

      if (
        !Number.isSafeInteger(receiverBalance) ||
        receiverBalance < 0 ||
        !Number.isSafeInteger(receiverBalance + amountInKobo)
      ) {
        throw new Error(
          "The recipient account has an invalid simulated balance. Please contact support.",
        );
      }

      await database.updateDocument(
        DATABASE_ID,
        BANK_COLLECTION_ID,
        senderBank.$id,
        {
          simulatedBalance: senderBalance - amountInKobo,
        },
        [],
        transactionId,
      );

      await database.updateDocument(
        DATABASE_ID,
        BANK_COLLECTION_ID,
        transactionalReceiver.$id,
        {
          simulatedBalance: receiverBalance + amountInKobo,
        },
        [],
        transactionId,
      );

      await database.createDocument(
        DATABASE_ID,
        TRANSACTION_COLLECTION_ID,
        requestId,
        {
          name: note,
          description: note,
          amount: amountInNaira,
          senderId: senderBank.userId,
          senderBankId: senderBank.$id,
          receiverId: transactionalReceiver.userId,
          receiverBankId: transactionalReceiver.$id,
          email: receiverUser.email,
          channel: "online",
          category: "Transfer",
        },
        [],
        transactionId,
      );
    }

    await database.updateTransaction({
      transactionId,
      commit: true,
    });

    committed = true;

    return {
      status: true,
      message:
        transferType === "external"
          ? "Simulated external transfer recorded successfully. No external payment was sent."
          : "Simulated transfer completed successfully.",
    };
  } catch (error) {
    if (transactionId && !committed) {
      try {
        await database.updateTransaction({
          transactionId,
          rollback: true,
        });
      } catch (rollbackError) {
        console.error("Transaction rollback failed:", rollbackError);
      }
    }

    // Check whether the transfer was already completed.
    try {
      const existingAfterFailure = await findExistingTransfer(
        database,
        requestId,
      );

      if (existingAfterFailure) {
        return verifyExistingTransfer(
          existingAfterFailure,
          verificationDetails,
        );
      }
    } catch (verificationError) {
      console.error(
        "Could not verify transfer after failure:",
        verificationError,
      );

      if (
        getErrorMessage(verificationError).includes(
          "belongs to a different transfer",
        )
      ) {
        throw verificationError;
      }
    }

    if (
      error instanceof Error &&
      error.message === "Insufficient simulated funds."
    ) {
      return {
        status: false,
        message: "Insufficient simulated funds.",
      };
    }

    console.error("Transfer failed:", error);

    throw error;
  }
};

export const transferFunds = async (
  params: TransferFundsParams,
): Promise<TransferResult> => {
  try {
    return await performTransferFunds(params);
  } catch (error) {
    if (isNetworkError(error)) {
      console.error("Transfer connection error:", error);

      return {
        status: false,
        uncertain: true,
        message:
          "We couldn't confirm the transfer status because of a connection problem. Check your transaction history and account balance before trying again. If the transfer is not confirmed, retry using the same request.",
      };
    }

    const expectedErrors = [
      "Please sign in before transferring funds.",
      "Invalid transfer request ID.",
      "Please select a source account.",
      "Enter a valid transfer amount.",
      "Enter a valid 10-digit HavenTrust account number.",
      "Please enter the recipient's shareable ID.",
      "Choose a valid recipient identification method.",
      "Enter a valid recipient email address.",
      "Select the recipient's bank.",
      "Enter a valid 10-digit external bank account number.",
      "Choose a valid transfer type.",
      "Appwrite database configuration is incomplete.",
      "Invalid recipient shareable ID.",
      "Recipient account was not found.",
      "This identifier matches multiple accounts. Please contact support.",
      "Recipient account details could not be verified. Please try again.",
      "You cannot transfer funds to your own account.",
      "The recipient email does not match the account.",
      "You do not own the selected source account.",
      "The source account has an invalid simulated balance. Please contact support.",
      "Insufficient simulated funds.",
      "The recipient account has an invalid simulated balance. Please contact support.",
      "The recipient account changed. Please verify the recipient and try again.",
      "This request ID belongs to a different transfer. Verify the previous transfer before starting another.",
    ];

    const message = getErrorMessage(error);

    if (expectedErrors.includes(message)) {
      return {
        status: false,
        uncertain: false,
        message,
      };
    }

    console.error("Unexpected transfer error:", error);

    return {
      status: false,
      uncertain: true,
      message:
        "Something went wrong while processing the transfer. We couldn't confirm its final status. Check your transaction history and account balance before trying again. If the transfer is not confirmed, retry using the same request.",
    };
  }
};
