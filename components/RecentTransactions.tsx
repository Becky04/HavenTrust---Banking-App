import Link from "next/link";
import { TabsContent } from "@/components/ui/tabs";
import AccountTabs from "./AccountTabs";
import BankInfo from "./BankInfo";
import TransactionsTable from "./TransactionsTable";
import { Pagination } from "./Pagination";

const RecentTransactions = ({
  accounts,
  transactionsByAccount = {},
  appwriteItemId,
  page = 1,
}: RecentTransactionsProps) => {
  const rowsPerPage = 10;

  return (
    <section className="recent-transactions">
      <header className="flex items-center justify-between">
        <h2 className="recent-transactions-label">Recent transactions</h2>
        <Link
          href={`/transaction-history/?id=${appwriteItemId}`}
          className="view-all-btn"
        >
          View all
        </Link>
      </header>

      <AccountTabs accounts={accounts} initialId={appwriteItemId} syncServer>
        {accounts.map((account: Account) => {
          const transactions =
            transactionsByAccount[account.appwriteItemId] ?? [];
          const totalPages = Math.ceil(transactions.length / rowsPerPage);
          const currentTransactions = transactions.slice(
            (page - 1) * rowsPerPage,
            page * rowsPerPage,
          );

          return (
            <TabsContent
              value={account.appwriteItemId}
              key={account.id}
              className="mt-4 space-y-4"
            >
              <BankInfo
                account={account}
                appwriteItemId={appwriteItemId}
                type="full"
              />
              <TransactionsTable transactions={currentTransactions} />

              {totalPages > 1 && (
                <div className="my-4 w-full">
                  <Pagination totalPages={totalPages} page={page} />
                </div>
              )}
            </TabsContent>
          );
        })}
      </AccountTabs>
    </section>
  );
};

export default RecentTransactions;
