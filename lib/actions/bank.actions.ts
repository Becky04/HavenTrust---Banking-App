"use server";

import { monoRequest } from "@/lib/mono";
import { parseStringify } from "../utils";
import { getTransactionsByBankId } from "./transaction.actions";
import { getBanks, getBank } from "./user.actions";

// Get multiple bank accounts
export const getAccounts = async ({ userId }: getAccountsProps) => {
  try {
    const banks = await getBanks({ userId });

    if (!banks || banks.length === 0) {
      return parseStringify({
        data: [],
        totalBanks: 0,
        totalCurrentBalance: 0,
      });
    }

    const accounts = await Promise.all(
      banks?.map(async (bank: Bank) => {
        // get account info from Mono using the accountId we saved
        const accountResponse = await monoRequest(
          `/accounts/${bank.accountId}`,
        );
        const accountData = accountResponse.data.account;

        const account = {
          id: bank.accountId,
          availableBalance: accountData.balance / 100,
          currentBalance: accountData.balance / 100,
          institutionId: accountData.institution.bankCode,
          name: accountData.name,
          officialName: accountData.institution.name,
          mask: accountData.account_number?.slice(-4) || "0000",
          type: accountData.type,
          subtype: accountData.type,
          appwriteItemId: bank.$id,
          shareableId: bank.shareableId,
        };

        return account;
      }),
    );

    const totalBanks = accounts.length;
    const totalCurrentBalance = accounts.reduce((total, account) => {
      return total + account.currentBalance;
    }, 0);

    return parseStringify({ data: accounts, totalBanks, totalCurrentBalance });
  } catch (error) {
    console.error("Error getting accounts:", error);
  }
};

// Get one bank account
export const getAccount = async ({ appwriteItemId }: getAccountProps) => {
  try {
    const bank = await getBank({ documentId: appwriteItemId });

    if (!bank) {
      console.log("No bank found for id:", appwriteItemId);
      return null;
    }

    // get account info from Mono
    const accountResponse = await monoRequest(`/accounts/${bank.accountId}`);
    const accountData = accountResponse.data.account;

    // get transfer transactions from appwrite
    const transferTransactionsData = await getTransactionsByBankId({
      bankId: bank.$id,
    }).catch(() => ({ documents: [] }));

    const transferTransactions = transferTransactionsData.documents.map(
      (transferData: Transaction) => ({
        id: transferData.$id,
        name: transferData.name!,
        amount: transferData.amount!,
        date: transferData.$createdAt,
        paymentChannel: transferData.channel,
        category: transferData.category,
        type: transferData.senderBankId === bank.$id ? "debit" : "credit",
      }),
    );

    // get transactions from Mono
    const transactions = await getTransactions({ accountId: bank.accountId });

    const account = {
      id: bank.accountId,
      availableBalance: accountData.balance / 100,
      currentBalance: accountData.balance / 100,
      institutionId: accountData.institution.bankCode,
      name: accountData.name,
      officialName: accountData.institution.name,
      mask: accountData.account_number.slice(-4),
      type: accountData.type,
      subtype: accountData.type,
      appwriteItemId: bank.$id,
    };

    const allTransactions = [...transactions, ...transferTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return parseStringify({
      data: account,
      transactions: allTransactions,
    });
  } catch (error) {
    console.error("Error getting account:", error);
  }
};

// Get institution info from Mono
export const getInstitution = async ({
  institutionId,
}: getInstitutionProps) => {
  try {
    const response = await monoRequest(`/institutions/${institutionId}`);
    return parseStringify(response.data);
  } catch (error) {
    console.error("Error getting institution:", error);
  }
};

// Get transactions from Mono
export const getTransactions = async ({ accountId }: { accountId: string }) => {
  try {
    const response = await monoRequest(`/accounts/${accountId}/transactions`);
    console.log(
      "Mono transactions response:",
      JSON.stringify(response, null, 2),
    );

    const transactions = response.data.map((transaction: any) => ({
      id: transaction.id,
      name: transaction.narration,
      paymentChannel: "online",
      type: transaction.type, // "debit" or "credit"
      accountId: accountId,
      amount: transaction.amount / 100, // Mono returns amount in kobo
      pending: false,
      category: transaction.category || "",
      date: transaction.date,
      image: "",
    }));

    return transactions;
  } catch (error) {
    console.error("Error getting transactions:", error);
    return [];
  }
};
