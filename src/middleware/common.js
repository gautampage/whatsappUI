export const formatIndianCurrency = (number, fraction = 2) => {
  return (
    "₹" +
    new Intl.NumberFormat("en-IN", {
      // style: "currency",
      currency: "INR",
      minimumFractionDigits: fraction || 0,
    }).format(number)
  );
};

export function convertISOToDateString(isoString) {
  if (isoString) {
    const date = new Date(isoString);
    if (date == "Invalid Date") return "NA";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based, so add 1
    const yyyy = date.getFullYear();

    return `${dd}/${mm}/${yyyy}`;
  } else return "NA";
}

export function dateSeperatorMessage(isoString) {
  if (!isoString) return "NA";

  const date = new Date(isoString);
  if (isNaN(date)) return "NA"; // Invalid date

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";

  const options = { month: "short", day: "2-digit", year: "numeric" };
  return date.toLocaleDateString("en-US", options);
}
export const titleCaseString = (data) => {
  if (data && data.length) {
    return data
      .trim()
      .split(" ")
      .map((word) => {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");
  } else return data;
};
