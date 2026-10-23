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
        totalSimulatedBalance: 0,
      });
    }

    const accounts = await Promise.all(
      banks.map(async (bank: Bank) => {
        // Get real account information from Mono
        const accountResponse = await monoRequest(`/accounts/${bank.bankId}`);

        const accountData = accountResponse.data.account;

        const account = {
          id: bank.bankId,

          // Simulated balance from Appwrite, stored in kobo
          simulatedBalance: bank.simulatedBalance / 100,

          simulatedAccountNumber: bank.simulatedAccountNumber,

          institutionId: accountData.institution.bankCode,
          name: accountData.name,
          officialName: accountData.institution.name,
          type: accountData.type,
          appwriteItemId: bank.$id,
          shareableId: bank.shareableId,
        };
        return account;
      }),
    );

    const totalBanks = accounts.length;

    const totalCurrentBalance = accounts.reduce(
      (total, account) => total + account.currentBalance,
      0,
    );

    const totalSimulatedBalance = accounts.reduce(
      (total, account) => total + account.simulatedBalance,
      0,
    );

    return parseStringify({
      data: accounts,
      totalBanks,
      totalCurrentBalance,
      totalSimulatedBalance,
    });
  } catch (error) {
    console.error("Error getting accounts:", error);
    throw error;
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

    // Get real account information from Mono
    const accountResponse = await monoRequest(`/accounts/${bank.bankId}`);

    const accountData = accountResponse.data.account;

    // Get transfer transactions recorded in Appwrite
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

    // Get real transactions from Mono
    const transactions = await getTransactions({
      accountId: bank.bankId,
    });

    const account = {
      id: bank.bankId,

      // Simulated balance from Appwrite, stored in kobo
      simulatedBalance: bank.simulatedBalance / 100,

      simulatedAccountNumber: bank.simulatedAccountNumber,

      institutionId: accountData.institution.bankCode,
      name: accountData.name,
      officialName: accountData.institution.name,
      type: accountData.type,
      appwriteItemId: bank.$id,
      shareableId: bank.shareableId,
    };

    // Combine real Mono transactions and simulated transfers
    const allTransactions = [...transactions, ...transferTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return parseStringify({
      data: account,
      transactions: allTransactions,
    });
  } catch (error) {
    console.error("Error getting account:", error);
    throw error;
  }
};

// Get transactions from Mono
export const getTransactions = async ({ accountId }: { accountId: string }) => {
  try {
    const response = await monoRequest(`/accounts/${accountId}/transactions`);

    const transactions = response.data.map((transaction: any) => ({
      id: transaction.id,
      name: transaction.narration,
      paymentChannel: "online",
      type: transaction.type,
      accountId,
      amount: transaction.amount / 100,
      pending: false,
      category: transaction.category || "",
      date: transaction.date,
      image: "",
    }));

    return transactions;
  } catch (error) {
    console.error("Error getting Mono transactions:", error);
    return [];
  }
};
