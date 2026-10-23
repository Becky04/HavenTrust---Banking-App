"use client";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

import { getSliceColor } from "@/lib/chartColors";

ChartJS.register(ArcElement, Tooltip, Legend);

const DoughnutChart = ({ accounts }: DoughnutChartProps) => {
  const balances = accounts.map((a) => a.simulatedBalance ?? 0);
  const total = balances.reduce((sum, b) => sum + b, 0);
  const hasData = total > 0;

  const data = {
    labels: hasData ? accounts.map((a) => a.officialName) : ["No balance yet"],
    datasets: [
      {
        label: "Banks",
        // An empty grey ring shows when every balance is zero.
        data: hasData ? balances : [1],
        backgroundColor: hasData
          ? accounts.map((_, i) => getSliceColor(i))
          : ["#e5e7eb"],
        borderWidth: 0,
        hoverOffset: hasData ? 4 : 0,
      },
    ],
  };

  return (
    <Doughnut
      data={data}
      options={{
        cutout: "72%",
        plugins: {
          legend: { display: false },
          tooltip: { enabled: hasData },
        },
      }}
    />
  );
};

export default DoughnutChart;
