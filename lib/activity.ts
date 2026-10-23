const TZ = "Africa/Lagos";
const DAY = 24 * 60 * 60 * 1000;

const dayFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }); // 2026-10-13
const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  weekday: "short",
});

type ActivityTransaction = {
  amount: number | string;
  date: string;
  type: string;
};

export type WeeklyDay = { label: string; total: number };

export const getActivitySummary = (
  transactions: ActivityTransaction[] = [],
) => {
  const now = Date.now();
  const cutoff = now - 30 * DAY;

  let received = 0;
  let spent = 0;

  // Oldest day first, today last.
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now - (6 - i) * DAY);
    return {
      key: dayFormatter.format(d),
      label: weekdayFormatter.format(d),
      total: 0,
    };
  });

  const dayIndex = new Map(days.map((d, i) => [d.key, i]));

  for (const transaction of transactions) {
    const time = new Date(transaction.date).getTime();
    const amount = Math.abs(Number(transaction.amount));

    if (Number.isNaN(time) || !Number.isFinite(amount)) continue;

    const isCredit = transaction.type === "credit";
    const isDebit = transaction.type === "debit";

    if (time >= cutoff) {
      if (isCredit) received += amount;
      if (isDebit) spent += amount;
    }

    if (isDebit) {
      const index = dayIndex.get(dayFormatter.format(new Date(time)));
      if (index !== undefined) days[index].total += amount;
    }
  }

  const weekly: WeeklyDay[] = days.map(({ label, total }) => ({
    label,
    total,
  }));

  return {
    received,
    spent,
    weekly,
    weeklyTotal: weekly.reduce((sum, d) => sum + d.total, 0),
  };
};
