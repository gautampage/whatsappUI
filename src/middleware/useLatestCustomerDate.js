import { useMemo } from "react";

export function useLatestCustomerDate(messages) {
  return useMemo(() => {
    const longTimeAgo = "Long time ago";
    if (!messages) return longTimeAgo;

    let allMessages = [];

    // Flatten grouped messages if it's an object
    if (!Array.isArray(messages)) {
      Object.values(messages).forEach((group) => {
        if (Array.isArray(group)) {
          allMessages = allMessages.concat(group);
        }
      });
    } else {
      allMessages = messages;
    }

    // Filter only CUSTOMER messages
    const customerMessages = allMessages.filter(
      (msg) => msg.sender === "CUSTOMER"
    );

    if (customerMessages.length === 0) return longTimeAgo;

    // Find latest timestamp
    const latestTimestamp = customerMessages.reduce((latest, msg) => {
      const time = new Date(msg.timestamp).getTime();
      return time > latest ? time : latest;
    }, 0);

    if (!latestTimestamp) return longTimeAgo;

    const latestDate = new Date(latestTimestamp);
    const now = new Date();

    // Helper to format time in "hh:mm AM/PM"
    const formatTime = (date) =>
      date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

    // Compare date parts
    const isToday =
      latestDate.getDate() === now.getDate() &&
      latestDate.getMonth() === now.getMonth() &&
      latestDate.getFullYear() === now.getFullYear();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      latestDate.getDate() === yesterday.getDate() &&
      latestDate.getMonth() === yesterday.getMonth() &&
      latestDate.getFullYear() === yesterday.getFullYear();

    if (isToday) {
      return `Last seen at ${formatTime(latestDate)}`;
    } else if (isYesterday) {
      return `Last seen yesterday at ${formatTime(latestDate)}`;
    } else {
      return `Last seen on ${latestDate.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })}`;
    }
  }, [messages]);
}
export function getLatestDate(messages) {
  const longTimeAgo = "Long time ago";
  if (!messages) return longTimeAgo;

  let allMessages = [];

  // Flatten grouped messages if it's an object
  if (!Array.isArray(messages)) {
    Object.values(messages).forEach((group) => {
      if (Array.isArray(group)) {
        allMessages = allMessages.concat(group);
      }
    });
  } else {
    allMessages = messages;
  }

  // Filter only CUSTOMER messages
  const customerMessages = allMessages.filter(
    (msg) => msg.sender === "CUSTOMER"
  );

  if (customerMessages.length === 0) return longTimeAgo;

  // Find latest timestamp
  const latestTimestamp = customerMessages.reduce((latest, msg) => {
    const time = new Date(msg.timestamp).getTime();
    return time > latest ? time : latest;
  }, 0);

  if (!latestTimestamp) return longTimeAgo;

  const latestDate = new Date(latestTimestamp);
  const now = new Date();

  // Helper to format time in "hh:mm AM/PM"
  const formatTime = (date) =>
    date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  // Compare date parts
  const isToday =
    latestDate.getDate() === now.getDate() &&
    latestDate.getMonth() === now.getMonth() &&
    latestDate.getFullYear() === now.getFullYear();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    latestDate.getDate() === yesterday.getDate() &&
    latestDate.getMonth() === yesterday.getMonth() &&
    latestDate.getFullYear() === yesterday.getFullYear();

  if (isToday) {
    return `Last seen at ${formatTime(latestDate)}`;
  } else if (isYesterday) {
    return `Last seen yesterday at ${formatTime(latestDate)}`;
  } else {
    return `Last seen on ${latestDate.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })}`;
  }
}

export default useLatestCustomerDate;
