import moment from "moment-timezone";

export function mergeMessages(oldData, newData) {
  const merged = { ...oldData };

  // Merge newData into merged
  Object.keys(newData).forEach((date) => {
    if (!merged[date]) {
      merged[date] = [];
    }

    // Combine and remove duplicates by messageId (more reliable than timestamp)
    const allMessages = [...merged[date], ...newData[date]];

    const uniqueMessages = allMessages.reduce((acc, msg) => {
      if (!acc.some((m) => m.messageId === msg.messageId)) {
        acc.push(msg);
      }
      return acc;
    }, []);

    // Sort by numeric timestamp (ascending order - oldest first)
    uniqueMessages.sort((a, b) => {
      const timestampA = typeof a.timestamp === 'number' ? a.timestamp : parseInt(a.timestamp);
      const timestampB = typeof b.timestamp === 'number' ? b.timestamp : parseInt(b.timestamp);
      return timestampA - timestampB;
    });

    merged[date] = uniqueMessages;
  });

  // Sort outer object keys (dates) in descending order
  const sortedDates = Object.keys(merged).sort(
    (a, b) =>
      moment(a, "DD MMM YYYY").valueOf() - moment(b, "DD MMM YYYY").valueOf()
  );

  // Create sorted object
  const sortedResult = {};
  sortedDates.forEach((date) => {
    sortedResult[date] = merged[date];
  });

  return sortedResult;
}

export function getLatestCustomerTimestamp(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return null;

  // Filter only customer messages
  const customerMessages = messages.filter((msg) => msg.sender === "CUSTOMER");

  if (customerMessages.length === 0) return null;

  // Find the max timestamp
  return customerMessages.reduce((latest, msg) => {
    const msgTime = new Date(msg.timestamp).getTime();
    return msgTime > latest ? msgTime : latest;
  }, 0);
}
export default mergeMessages;
