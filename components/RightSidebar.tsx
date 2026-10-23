import { Target } from "lucide-react";

import BankCard from "./BankCard";
import MonoLink from "./MonoLink";

const RightSidebar = ({ user, banks }: RightSidebarProps) => {
  if (!user) return null;

  return (
    <aside className="right-sidebar">
      <section className="flex flex-col pb-8">
        <div className="profile-banner" />
        <div className="profile">
          <div className="profile-img">
            <span className="text-5xl font-old text-blue-500">
              {user?.name?.[0] ?? ""}
            </span>
          </div>
          <div className="profile-details ">
            <h1 className="profile-name">{user.name}</h1>
            <p className="profile-email">{user.email}</p>
          </div>
        </div>
      </section>

      <section className="banks">
        <div className="flex w-full items-center justify-between">
          <h2 className="header-2 ">My Banks</h2>
          <MonoLink user={user} />
        </div>

        {banks?.length > 0 && (
          <div className="relative flex flex-1 flex-col items-center justify-center gap-5">
            <div className="relative z-10">
              <BankCard
                key={banks[0].appwriteItemId}
                account={banks[0]}
                userName={user.name}
                showBalance={false}
              />
            </div>
            {banks[1] && (
              <div className="absolute right-0 top-8 z-0 w-[90%]">
                <BankCard
                  key={banks[1].appwriteItemId}
                  account={banks[1]}
                  userName={user.name}
                  showBalance={false}
                />
              </div>
            )}
          </div>
        )}

        {/* Decorative savings goal card */}
        <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-blue-50">
                <Target
                  size={20}
                  className="text-blue-600"
                  aria-hidden="true"
                />
              </span>
              <div className="flex flex-col">
                <p className="text-14 font-semibold text-gray-900">
                  Savings goal
                </p>
                <p className="text-12 text-gray-500">New laptop</p>
              </div>
            </div>

            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-12 font-medium text-blue-600">
              65%
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-blue-600 to-blue-400" />
            </div>

            <div className="flex items-center justify-between text-12">
              <span className="font-semibold text-gray-900">₦650,000</span>
              <span className="text-gray-500">of ₦1,000,000</span>
            </div>
          </div>
        </div>
      </section>
    </aside>
  );
};

export default RightSidebar;
