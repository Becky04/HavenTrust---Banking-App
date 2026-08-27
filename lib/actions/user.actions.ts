"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { cookies } from "next/headers";
import { encryptId, extractCustomerIdFromUrl, parseStringify } from "../utils";
// import {
//   CountryCode,
//   ProcessorTokenCreateRequest,
//   ProcessorTokenCreateRequestProcessorEnum,
//   Products,
// } from "plaid";

import { plaidClient } from "@/lib/plaid";
import { revalidatePath } from "next/cache";
import { addFundingSource, createDwollaCustomer } from "./dwolla.actions";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
  APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID,
} = process.env;

export const getUserInfo = async ({ userId }: { userId: string }) => {
  try {
    const { database } = await createAdminClient();

    const user = await database.listDocuments(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      [Query.equal("userId", userId)],
    );

    return parseStringify(user.documents[0]);
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const signIn = async ({ email, password }: signInProps) => {
  try {
    const { account } = await createAdminClient();
    const session = await account.createEmailPasswordSession(email, password);

    const cookieStore = await cookies();

    cookieStore.set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    const user = await getUserInfo({ userId: session.userId });

    return parseStringify(session);
  } catch (error) {
    console.error("Error", error);
  }
};

export const signUp = async ({ password, ...userData }: SignUpParams) => {
  const { email, firstName, lastName } = userData;

  let newUserAccount;

  try {
    const { account, database } = await createAdminClient();

    newUserAccount = await account.create(
      ID.unique(),
      email,
      password,
      `${firstName} ${lastName}`,
    );

    if (!newUserAccount) throw new Error("Error creating user");

    const newUser = await database.createDocument(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      ID.unique(),
      {
        ...userData,
        userId: newUserAccount.$id,
      },
    );

    const session = await account.createEmailPasswordSession(email, password);

    const cookieStore = await cookies();

    cookieStore.set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    return parseStringify(newUser);
  } catch (error) {
    console.error("Error", error);
  }
};

export async function getLoggedInUser() {
  try {
    const { account } = await createSessionClient();
    const result = await account.get();

    const user = await getUserInfo({ userId: result.$id });

    return parseStringify({
      ...user, // has firstName, lastName, address1, etc.
      name: result.name, // has name from auth account
      $id: result.$id, // make sure $id is always available
    });
  } catch (error) {
    // console.log(error);
    return null;
  }
}

export const logoutAccount = async () => {
  try {
    const { account } = await createSessionClient();

    const cookieStore = await cookies();

    cookieStore.delete("appwrite-session");

    await account.deleteSession("current");
  } catch (error) {
    return null;
  }
};

// export const createLinkToken = async (user: User) => {
//   try {
//     const tokenParams = {
//       user: {
//         client_user_id: user.$id,
//       },
//       client_name: `${user.firstName} ${user.lastName}`,
//       products: ["auth"] as Products[],
//       language: "en",
//       country_codes: ["US"] as CountryCode[],
//     };

//     const response = await plaidClient.linkTokenCreate(tokenParams);

//     return parseStringify({ linkToken: response.data.link_token });
//   } catch (error) {
//     console.log(error);
//   }
// };

// In lib/actions/user.actions.ts
import { monoRequest, initiateMonoTransfer } from "@/lib/mono";

// ─── Called if you need to pre-create a Mono customer server-side ───────────
// (Optional: @mono.co/connect.js can create the customer automatically on success)
export const createMonoCustomer = async (user: User) => {
  try {
    const response = await monoRequest("/customers", {
      method: "POST",
      body: JSON.stringify({
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      }),
    });

    // Save response.data.id as user.monoCustomerId in your DB
    return parseStringify({ customerId: response.data.id });
  } catch (error) {
    console.error("Mono createCustomer error:", error);
  }
};

// ─── Replaces exchangePublicToken ───────────────────────────────────────────
// Exchanges the temporary `code` from the widget for a permanent Account ID
export const exchangeMonoToken = async ({
  code,
  user,
}: {
  code: string;
  user: User;
}) => {
  try {
    console.log("1. Starting exchange");

    const authResponse = await monoRequest("/accounts/auth", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    console.log("2. Auth response:", authResponse);

    const accountId = authResponse.data.id;
    console.log("3. Account ID:", accountId);

    const accountResponse = await monoRequest(`/accounts/${accountId}`);
    console.log("4. Account response received");

    const accountData = accountResponse.data.account;
    console.log("5. Full account data:", JSON.stringify(accountData, null, 2)); // ← replace line

    console.log("6. Calling createBankAccount with userId:", user.userId);

    await createBankAccount({
      userId: user.userId,
      bankId: accountId,
      accountId: accountId,
      accessToken: accountId,
      fundingSourceUrl: "",
      shareableId: encryptId(accountId),
    });

    console.log("7. createBankAccount done");

    revalidatePath("/");
    return parseStringify({ publicTokenExchange: "complete" });
  } catch (error) {
    console.error("exchangeMonoToken error at step:", error);
  }
};

// export const createBankAccount = async ({
//   userId,
//   bankId,
//   accountId,
//   accessToken,
//   fundingSourceUrl,
//   shareableId,
// }: createBankAccountProps) => {
//   try {
//     const { database } = await createAdminClient();

//     const bankAccount = await database.createDocument(
//       DATABASE_ID!,
//       BANK_COLLECTION_ID!,
//       ID.unique(),
//       {
//         userId,
//         bankId,
//         accountId,
//         accessToken,
//         fundingSourceUrl,
//         shareableId,
//       },
//     );

//     return parseStringify(bankAccount);
//   } catch (error) {
//     console.log(error);
//   }
// };

// export const exchangePublicToken = async ({
//   publicToken,
//   user,
// }: exchangePublicTokenProps) => {
//   try {
//     // Exchange public token for access token and item ID
//     const response = await plaidClient.itemPublicTokenExchange({
//       public_token: publicToken,
//     });

//     const accessToken = response.data.access_token;
//     const itemId = response.data.item_id;

//     // Get account information from Plaid using the access token
//     const accountsResponse = await plaidClient.accountsGet({
//       access_token: accessToken,
//     });

//     const accountData = accountsResponse.data.accounts[0];

//     // Create a processor token for Dwolla using the access token and account ID
//     const request: ProcessorTokenCreateRequest = {
//       access_token: accessToken,
//       account_id: accountData.account_id,
//       processor: "dwolla" as ProcessorTokenCreateRequestProcessorEnum,
//     };

//     const processorTokenResponse =
//       await plaidClient.processorTokenCreate(request);
//     const processorToken = processorTokenResponse.data.processor_token;

//     // Create a funding source URL for the account using the Dwolla customer ID, processor token, and bank name
//     const fundingSourceUrl = await addFundingSource({
//       dwollaCustomerId: user.dwollaCustomerId,
//       processorToken,
//       bankName: accountData.name,
//     });

//     // If the funding source URL is not created, throw an error
//     if (!fundingSourceUrl) throw Error;

//     // Create a bank account using the user ID, item ID, account ID, access token, funding source URL, and shareableId ID
//     await createBankAccount({
//       userId: user.$id,
//       bankId: itemId,
//       accountId: accountData.account_id,
//       accessToken,
//       fundingSourceUrl,
//       shareableId: encryptId(accountData.account_id),
//     });

//     // Revalidate the path to reflect the changes
//     revalidatePath("/");

//     // Return a success message
//     return parseStringify({
//       publicTokenExchange: "complete",
//     });
//   } catch (error) {
//     console.error("An error occurred while creating exchanging token:", error);
//   }
// };

export const createBankAccount = async ({
  userId,
  bankId,
  accountId,
  accessToken,
  fundingSourceUrl,
  shareableId,
}: createBankAccountProps) => {
  try {
    const { database } = await createAdminClient();

    const bankAccount = await database.createDocument(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        users: userId,
        bankId,
        accountId,
        accessToken,
        fundingSourceUrl: fundingSourceUrl || "", // fallback to empty string
        shareableId,
      },
    );
    console.log("Bank account created:", bankAccount); // add this
    return parseStringify(bankAccount);
  } catch (error) {
    console.log("createBankAccount error:", error); // change this
  }
};

export const getBanks = async ({ userId }: getBanksProps) => {
  try {
    const { database } = await createAdminClient();
    console.log("getBanks called with userId:", userId);

    const banks = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal("userId", [userId])], // use a plain string field, not relationship
    );

    return parseStringify(banks.documents);
  } catch (error) {
    console.log(error);
  }
};

export const getBank = async ({ documentId }: getBankProps) => {
  try {
    const { database } = await createAdminClient();

    const bank = await database.getDocument(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      documentId, // just pass the ID directly
    );

    return parseStringify(bank);
  } catch (error) {
    console.log(error);
  }
};

export const getBankByAccountId = async ({
  accountId,
}: getBankByAccountIdProps) => {
  try {
    const { database } = await createAdminClient();

    const bank = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal("accountId", [accountId])],
    );

    if (bank.total !== 1) return null;

    return parseStringify(bank.documents[0]);
  } catch (error) {
    console.log(error);
  }
};
