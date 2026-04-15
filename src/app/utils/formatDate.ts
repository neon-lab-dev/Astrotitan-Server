// utils/formatDate.ts
export const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);

  const day = date.getDate();
  const year = date.getFullYear();
  const month = date.toLocaleString("en-US", { month: "short" }); // e.g. "Jan", "Feb", etc.

  return `${day} ${month}, ${year}`;
};