export const CHART_COLORS = [
  "#0747B6",
  "#2265d8",
  "#2f91fa",
  "#7db8fb",
  "#b6d6fd",
];

export const getSliceColor = (index: number) =>
  CHART_COLORS[index % CHART_COLORS.length];
