import HeaderBox from "@/components/HeaderBox";
import RecentTransactions from "@/components/RecentTransactions";
import RightSidebar from "@/components/RightSidebar";
import ToastTrigger from "@/components/ToastTrigger";
import TotalBalanceBox from "@/components/TotalBalanceBox";
import { getAccount, getAccounts } from "@/lib/actions/bank.actions";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import { Suspense } from "react";

const Home = async ({ searchParams }: SearchParamProps) => {
  const { id, page } = await searchParams;
  const currentPage = Number(page as string) || 1;

  const loggedIn = await getLoggedInUser();

  if (!loggedIn) return null;

  const accounts = await getAccounts({
    userId: loggedIn.userId,
  });

  if (!accounts) {
    return (
      <section className="home">
        <Suspense fallback={null}>
          <ToastTrigger />
        </Suspense>
        <div className="home-content">
          <HeaderBox
            type="greeting"
            title="Welcome"
            user={loggedIn.name || "Guest"}
            subtext="Access and manage your account and transactions efficiently."
          />
          <p className="mt-6 text-gray-600">
            We couldn't load your bank accounts. Please refresh the page and try
            again.
          </p>
        </div>
      </section>
    );
  }

  const accountsData = accounts.data || [];

  if (accountsData.length === 0) {
    return (
      <section className="home">
        <Suspense fallback={null}>
          <ToastTrigger />
        </Suspense>
        <div className="home-content">
          <HeaderBox
            type="greeting"
            title="Welcome"
            user={loggedIn.name || "Guest"}
            subtext="Access and manage your account and transactions efficiently."
          />

          <div className="mt-8 rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              No linked bank accounts yet
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Link a bank account to see its details and transactions here.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const appwriteItemId = (id as string) || accountsData[0].appwriteItemId;

  const accountsWithTransactions = await Promise.all(
    accountsData.map(async (acc: Account) => {
      const full = await getAccount({ appwriteItemId: acc.appwriteItemId });
      return {
        appwriteItemId: acc.appwriteItemId,
        transactions: full?.transactions ?? [],
      };
    }),
  );

  const transactionsByAccount = Object.fromEntries(
    accountsWithTransactions.map((a) => [a.appwriteItemId, a.transactions]),
  );

  return (
    <section className="home">
      <Suspense fallback={null}>
        <ToastTrigger />
      </Suspense>
      <div className="home-content">
        <header className="home-header">
          <HeaderBox
            type="greeting"
            title="Welcome"
            user={loggedIn.name || "Guest"}
            subtext="Access and manage your account and transactions efficiently."
          />

          <TotalBalanceBox
            accounts={accountsData}
            totalBanks={accounts.totalBanks}
            totalSimulatedBalance={accounts.totalSimulatedBalance}
          />
        </header>

        <RecentTransactions
          accounts={accountsData}
          transactionsByAccount={transactionsByAccount}
          appwriteItemId={appwriteItemId}
          page={currentPage}
        />
      </div>

      <RightSidebar
        user={loggedIn}
        transactions={accounts?.transactions}
        banks={accountsData.slice(0, 2)}
      />
    </section>
  );
};

export default Home;
