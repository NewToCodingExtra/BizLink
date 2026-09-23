function trimNumber(value) {
  return Number(value).toFixed(2).replace(/\.?0+$/, "");
}

export function formatCapital(amount) {
  if (amount === null || amount === undefined || amount === "") return "";
  const n = Number(amount);
  if (!Number.isFinite(n)) return String(amount);
  if (n >= 1000000) return `\u20B1${trimNumber(n / 1000000)}M`;
  if (n >= 1000) return `\u20B1${trimNumber(n / 1000)}K`;
  return `\u20B1${n.toLocaleString("en-PH")}`;
}

export function formatRoi(percent) {
  if (percent === null || percent === undefined || percent === "") return "";
  const n = Number(percent);
  if (!Number.isFinite(n)) return String(percent);
  return `${trimNumber(n)}% ROI`;
}

export function displayCapital(opp) {
  return formatCapital(opp?.capitalAmount) || opp?.capitalRequired || "";
}

export function displayRoi(opp) {
  return formatRoi(opp?.roiPercent) || opp?.roi || "";
}
