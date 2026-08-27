"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { parseStringify } from "../utils";
import { getMonoAccountDetails } from "@/lib/mono"; // safe here — server only
import { sendPaystackTransfer } from "@/lib/paystack"; // ✅ replace mono import

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_TRANSACTION_COLLECTION_ID: TRANSACTION_COLLECTION_ID,
} = process.env;

export const createTransaction = async (
  transaction: CreateTransactionProps,
) => {
  try {
    const { database } = await createAdminClient();

    const newTransaction = await database.createDocument(
      DATABASE_ID!,
      TRANSACTION_COLLECTION_ID!,
      ID.unique(),
      {
        channel: "online",
        category: "Transfer",
        ...transaction,
      },
    );

    return parseStringify(newTransaction);
  } catch (error) {
    console.log(error);
  }
};

export const getTransactionsByBankId = async ({
  bankId,
}: getTransactionsByBankIdProps) => {
  try {
    const { database } = await createAdminClient();

    const senderTransactions = await database.listDocuments(
      DATABASE_ID!,
      TRANSACTION_COLLECTION_ID!,
      [Query.equal("senderBankId", bankId)],
    );

    const receiverTransactions = await database.listDocuments(
      DATABASE_ID!,
      TRANSACTION_COLLECTION_ID!,
      [Query.equal("receiverBankId", bankId)],
    );

    const transactions = {
      total: senderTransactions.total + receiverTransactions.total,
      documents: [
        ...senderTransactions.documents,
        ...receiverTransactions.documents,
      ],
    };

    return parseStringify(transactions);
  } catch (error) {
    console.log(error);
    // return empty transactions instead of undefined
    return { total: 0, documents: [] };
  }
};

// export const transferFunds = async ({
//   accountId,
//   amount,
//   description,
//   customer,
// }: {
//   accountId: string;
//   amount: number;
//   description: string;
//   customer: { name: string; email: string };
// }) => {
//   return initiateMonoTransfer({ accountId, amount, description, customer });
// };

export const transferFunds = async ({
  receiverAccountId,
  amount,
  description,
}: {
  receiverAccountId: string;
  amount: number;
  description: string;
}) => {
  const isDev = process.env.NODE_ENV === "development";

  // In dev, skip actual transfer and return mock success
  if (isDev) {
    console.log("Dev mode: skipping real transfer");
    return { status: true, data: { reference: `DEV-${Date.now()}` } };
  }

  const accountDetails = await getMonoAccountDetails(receiverAccountId);

  return sendPaystackTransfer({
    amount: amount * 100,
    name: accountDetails.name,
    accountNumber: accountDetails.account_number,
    bankCode: accountDetails.institution.bank_code,
    description,
  });
};
