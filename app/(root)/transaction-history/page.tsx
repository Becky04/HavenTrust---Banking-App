import HeaderBox from "@/components/HeaderBox";
import { Pagination } from "@/components/Pagination";
import TransactionsTable from "@/components/TransactionsTable";
import { getAccount, getAccounts } from "@/lib/actions/bank.actions";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import { formatAmount } from "@/lib/utils";
import { TabsContent } from "@/components/ui/tabs";
import AccountTabs from "@/components/AccountTabs";

const TransactionHistory = async ({ searchParams }: SearchParamProps) => {
  const { id, page } = await searchParams;

  const currentPage = Number(page as string) || 1;
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) return null;

  const accounts = await getAccounts({
    userId: loggedIn.userId,
  });

  const accountsData = accounts?.data ?? [];
  console.log("accountsData", accountsData);
  console.log("mask", accountsData.mask);
  if (accountsData.length === 0) {
    return (
      <div className="transactions">
        <div className="transactions-header">
          <HeaderBox
            title="Transaction History"
            subtext="See your bank details and transactions across all accounts."
          />
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            No bank accounts linked yet
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Link a bank account to view your transaction history here.
          </p>
        </div>
      </div>
    );
  }

  const appwriteItemId = (id as string) || accountsData[0].appwriteItemId;

  const accountsWithTransactions = await Promise.all(
    accountsData.map(async (acc: Account) => {
      const fullAccount = await getAccount({
        appwriteItemId: acc.appwriteItemId,
      });
      return fullAccount;
    }),
  );

  const rowsPerPage = 10;

  return (
    <div className="transactions">
      <div className="transactions-header">
        <HeaderBox
          title="Transaction History"
          subtext="See your bank details and transactions across all accounts."
        />
      </div>

      <div className="space-y-6">
        <AccountTabs accounts={accountsData} initialId={appwriteItemId}>
          {accountsWithTransactions.map((accountObj) => {
            if (!accountObj) return null;

            const accountData = accountObj.data;
            const transactions = accountObj.transactions || [];

            const totalPages = Math.ceil(transactions.length / rowsPerPage);
            const indexOfLastTransaction = currentPage * rowsPerPage;
            const indexOfFirstTransaction =
              indexOfLastTransaction - rowsPerPage;
            const currentTransactions = transactions.slice(
              indexOfFirstTransaction,
              indexOfLastTransaction,
            );

            return (
              <TabsContent
                value={accountData.appwriteItemId}
                key={accountData.id}
                className="space-y-6"
              >
                <div className="transactions-account">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-18 font-bold text-white">
                      {loggedIn.name}
                    </h2>
                    <p className="text-14 text-blue-25">
                      {accountData.officialName}
                    </p>
                    <p className="text-14 font-semibold tracking-[1.1px] text-white">
                      ●●●● ●●●● ●●●●{" "}
                      <span className="text-16">
                        {accountData.simulatedAccountNumber.slice(-4)}
                      </span>
                    </p>
                  </div>

                  <div className="transactions-account-balance">
                    <p className="text-14">Current balance</p>
                    <p className="text-24 text-center font-bold">
                      {formatAmount(accountData.simulatedBalance ?? 0)}
                    </p>
                  </div>
                </div>

                <section className="flex w-full flex-col gap-6">
                  <TransactionsTable transactions={currentTransactions} />

                  {totalPages > 1 && (
                    <div className="my-4 w-full">
                      <Pagination totalPages={totalPages} page={currentPage} />
                    </div>
                  )}
                </section>
              </TabsContent>
            );
          })}
        </AccountTabs>
      </div>
    </div>
  );
};

export default TransactionHistory;
