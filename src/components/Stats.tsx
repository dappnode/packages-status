import React from "react";
import { PackageRow, UpdateStatus } from "../logic/types";
import { updateStatusColorMap } from "../logic/utils";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, registerables } from "chart.js";

ChartJS.register(...registerables);

const options = {
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

export default function Stats({ rows }: { rows: PackageRow[] }) {
  const statusCounts = rows.reduce<Record<string, number>>((counts, row) => {
    const status: UpdateStatus | "other" = [
      "updated",
      "patch",
      "minor",
      "major",
      "premajor",
      "preminor",
      "prepatch",
      "prerelease",
      "NA",
    ].includes(row.updateStatus)
      ? row.updateStatus
      : "other";
    return {
      ...counts,
      [status]: (counts[status] || 0) + 1,
    };
  }, {});

  const data = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        label: "# of Packages",
        data: Object.values(statusCounts),
        backgroundColor: Object.keys(statusCounts).map(
          (status) => updateStatusColorMap[status as UpdateStatus | "other"]
        ),
      },
    ],
  };

  return <Bar data={data} options={options} />;
}
