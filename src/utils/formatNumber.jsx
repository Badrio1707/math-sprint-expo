export const formatNumber = (num = 0) => {
  if (num === null || num === undefined || isNaN(num)) return "0";

  const n = Number(num);

  // juta ke atas
  if (n >= 1_000_000) {
    const value = (n / 1000).toFixed(0); // jadi "1200"
    return `${value.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}K`;
  }

  // ribuan ke atas
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};
