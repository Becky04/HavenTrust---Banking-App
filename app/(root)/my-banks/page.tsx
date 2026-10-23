import BankCard from "@/components/BankCard";
import HeaderBox from "@/components/HeaderBox";
import { getAccounts } from "@/lib/actions/bank.actions";
import { getLoggedInUser } from "@/lib/actions/user.actions";

const MyBanks = async () => {
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) return null;

  const accounts = await getAccounts({
    userId: loggedIn.userId,
  });

  const accountsData = accounts?.data ?? [];

  return (
    <section className="flex">
      <div className="my-banks">
        <HeaderBox
          title="My Bank Accounts"
          subtext="Effortlessly manage your banking activities."
        />

        <div className="mt-6 space-y-4">
          <h2 className="header-2">Your cards</h2>

          {accountsData.length > 0 ? (
            <div className="flex flex-wrap gap-6">
              {accountsData.map((a: Account) => (
                <BankCard
                  key={a.id}
                  account={a}
                  userName={`${loggedIn.firstName} ${loggedIn.lastName}`}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900">
                No bank accounts linked yet
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                You haven't linked any bank accounts yet. Link a bank account to
                view and manage your accounts here.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default MyBanks;
