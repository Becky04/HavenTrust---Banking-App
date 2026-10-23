import { formatAmount } from "@/lib/utils";
import { getSliceColor } from "@/lib/chartColors";
import AnimatedCounter from "./AnimatedCounter";
import DoughnutChart from "./DoughnutChart";

const TotalBalanceBox = ({
  accounts = [],
  totalBanks,
  totalSimulatedBalance,
}: TotalBalanceBoxProps) => {
  return (
    <section className="flex w-full flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:gap-8 sm:p-6">
      {/* Chart: centred on mobile, left on desktop */}
      <div className="mx-auto size-40 shrink-0 sm:mx-0 sm:size-44">
        <DoughnutChart accounts={accounts} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-12 font-medium text-blue-600">
            {totalBanks} linked {totalBanks === 1 ? "account" : "accounts"}
          </span>

          <p className="text-14 font-medium text-gray-500">Total balance</p>

          <div className="total-balance-amount flex-center !justify-start gap-2">
            <AnimatedCounter amount={totalSimulatedBalance} />
          </div>
        </div>

        {/* Per-account breakdown, colours match the chart */}
        {accounts.length > 0 && (
          <ul className="flex flex-col divide-y divide-gray-100 border-t border-gray-100">
            {accounts.map((account: any, index: number) => (
              <li
                key={account.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: getSliceColor(index) }}
                    aria-hidden="true"
                  />
                  <span className="truncate text-14 text-gray-700">
                    {account.officialName}
                  </span>
                </div>

                <span className="shrink-0 text-14 font-semibold text-gray-900">
                  {formatAmount(account.simulatedBalance ?? 0)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default TotalBalanceBox;
