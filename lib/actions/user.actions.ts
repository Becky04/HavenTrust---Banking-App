"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { cookies } from "next/headers";
import { encryptId, parseStringify } from "../utils";
import { revalidatePath } from "next/cache";
import { monoRequest } from "@/lib/mono";
import { randomInt } from "node:crypto";
import { redirect } from "next/navigation";

import {
  ACTIVITY_COOKIE,
  SESSION_COOKIE,
  activityCookieOptions,
} from "@/lib/session-config";

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

    (await cookies()).set(
      ACTIVITY_COOKIE,
      String(Date.now()),
      activityCookieOptions,
    );

    return parseStringify(session);
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

export const signUp = async ({ password, ...userData }: SignUpParams) => {
  const { email, firstName, lastName } = userData;

  let newUserAccount;
  const { account, database, users } = await createAdminClient();

  try {
    newUserAccount = await account.create(
      ID.unique(),
      email,
      password,
      `${firstName} ${lastName}`,
    );

    if (!newUserAccount) {
      throw new Error("Error creating user");
    }

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
      secure: process.env.NODE_ENV === "production",
    });

    (await cookies()).set(
      ACTIVITY_COOKIE,
      String(Date.now()),
      activityCookieOptions,
    );

    return parseStringify(newUser);
  } catch (error: any) {
    console.error("Error creating user:", error);

    if (
      error?.code === 409 ||
      error?.type === "user_already_exists" ||
      error?.message?.toLowerCase().includes("already exists")
    ) {
      throw new Error(
        "An account with this email or phone number already exists. Please sign in instead.",
      );
    }

    if (newUserAccount) {
      try {
        await users.delete(newUserAccount.$id);
      } catch (cleanupError) {
        console.error(
          "Failed to clean up the incomplete user account:",
          cleanupError,
        );
      }
    }

    throw error;
  }
};

function isConnectivityError(error: unknown): boolean {
  const err = error as {
    message?: string;
    code?: string;
    cause?: { message?: string; code?: string };
  };

  const details = [
    err?.message,
    err?.code,
    err?.cause?.message,
    err?.cause?.code,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return /fetch failed|failed to fetch|network error|network request failed|econnrefused|econnreset|enotfound|etimedout|und_err|socket hang up|connect timeout|networkerror/.test(
    details,
  );
}

export async function getLoggedInUser() {
  try {
    const { account } = await createSessionClient();
    const result = await account.get();

    const user = await getUserInfo({ userId: result.$id });

    return parseStringify({
      ...user,
      email: result.email,
      name: result.name,
      $id: result.$id,
    });
  } catch (error) {
    // A connection failure does not prove the user is signed out.
    if (isConnectivityError(error)) {
      throw error;
    }

    // For other errors, treat the user as not authenticated.
    return null;
  }
}

// export const logoutAccount = async () => {
//   try {
//     const { account } = await createSessionClient();

//     const cookieStore = await cookies();

//     await account.deleteSession("current");

//     cookieStore.delete("appwrite-session");
//   } catch (error) {
//     return null;
//   }

//   redirect("/sign-in");
// };

export const logoutAccount = async () => {
  const cookieStore = await cookies();

  try {
    const { account } = await createSessionClient();
    await account.deleteSession("current");
  } catch (error) {
    // Session may already be expired or deleted (e.g. by middleware).
    console.error("Logout: could not delete Appwrite session:", error);
  } finally {
    cookieStore.delete(SESSION_COOKIE);
    cookieStore.delete(ACTIVITY_COOKIE);
  }

  redirect("/sign-in");
};

// In lib/actions/user.actions.ts

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
    const authResponse = await monoRequest("/accounts/auth", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    const accountId = authResponse.data.id;
    const accountResponse = await monoRequest(`/accounts/${accountId}`);
    const accountData = accountResponse.data.account;
    await createBankAccount({
      userId: user.userId,
      bankId: accountId,
      // accountId: accountId,
      // accessToken: accountId,
      // fundingSourceUrl: "",
      shareableId: encryptId(accountId),
    });

    revalidatePath("/");
    return parseStringify({ publicTokenExchange: "complete" });
  } catch (error) {
    console.error("exchangeMonoToken error at step:", error);
  }
};

export const createBankAccount = async ({
  userId,
  bankId,
  // accountId,
  // accessToken,
  // fundingSourceUrl,
  shareableId,
}: createBankAccountProps) => {
  try {
    const { database } = await createAdminClient();

    // Find the user's document in the Users collection.
    const user = await getUserInfo({ userId });

    if (!user?.$id) {
      throw new Error("Could not find the user's Appwrite document.");
    }

    // Generate a unique, 10-digit simulated account number.
    let simulatedAccountNumber = "";
    let isUnique = false;

    for (let attempt = 0; attempt < 10; attempt++) {
      simulatedAccountNumber = String(
        randomInt(1, 10) * 1_000_000_000 + randomInt(0, 1_000_000_000),
      );

      const existingAccounts = await database.listDocuments(
        DATABASE_ID!,
        BANK_COLLECTION_ID!,
        [
          Query.equal("simulatedAccountNumber", simulatedAccountNumber),
          Query.limit(1),
        ],
      );

      if (existingAccounts.total === 0) {
        isUnique = true;
        break;
      }
    }

    if (!isUnique) {
      throw new Error(
        "Could not generate a unique account number. Please try again.",
      );
    }

    const bankAccount = await database.createDocument(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        users: user.$id,
        bankId,
        shareableId,
        simulatedAccountNumber,
        simulatedBalance: 10000000,
      },
    );

    console.log("Bank account created successfully.");

    return parseStringify(bankAccount);
  } catch (error) {
    console.error("createBankAccount error:", error);
    throw error;
  }
};

export const getBanks = async ({ userId }: getBanksProps) => {
  try {
    const { database } = await createAdminClient();

    const banks = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal("userId", [userId])],
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
      documentId,
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
