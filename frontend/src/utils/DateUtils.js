// Convert UTC time to UTC+1
export const formatCzechDate = (sqlliteCreatedAt) => {
  if (!sqlliteCreatedAt) return "";

  // Replacing empty space for T and adding Z to achieve YYYY-MM-DDTHH:MM:SSZ
  const isoDate = sqlliteCreatedAt.includes("T") ? sqlliteCreatedAt : sqlliteCreatedAt.replace(" ", "T") + "Z";

  return new Date(isoDate).toLocaleString("cs-CZ");
};
