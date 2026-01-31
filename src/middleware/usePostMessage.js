import { useCallback, useEffect, useState } from "react";

export const usePostMessage = (options = {}) => {
  const [messages, setMessages] = useState([]);
  const [latestMessage, setLatestMessage] = useState(null);

  const {
    allowedOrigins = [], // Array of allowed origins for security
    onMessage = null, // Custom message handler
    storeInLocalStorage = true,
    maxStoredMessages = 50,
  } = options;

  const handleMessage = useCallback(
    (event) => {
      // Security check for allowed origins
      if (allowedOrigins.length > 0 && !allowedOrigins.includes(event.origin)) {
        console.warn("Message from unauthorized origin:", event.origin);
        return;
      }

      const messageData = {
        id: Date.now() + Math.random(),
        data: event.data,
        origin: event.origin,
        timestamp: new Date().toISOString(),
        processed: false,
      };

      // Update state
      setLatestMessage(messageData);
      setMessages((prev) => {
        const newMessages = [messageData, ...prev].slice(0, maxStoredMessages);
        return newMessages;
      });

      // Store in localStorage
      if (storeInLocalStorage) {
        try {
          // Store individual message
          localStorage.setItem(
            `postMessage_${messageData.id}`,
            JSON.stringify(messageData)
          );

          // Store latest message
          localStorage.setItem(
            "latestPostMessage",
            JSON.stringify(messageData)
          );

          // Store message history (limited)
          const messageHistory = JSON.parse(
            localStorage.getItem("postMessageHistory") || "[]"
          );
          messageHistory.unshift(messageData);
          const limitedHistory = messageHistory.slice(0, maxStoredMessages);
          localStorage.setItem(
            "postMessageHistory",
            JSON.stringify(limitedHistory)
          );
        } catch (error) {
          console.error("Error storing message in localStorage:", error);
        }
      }

      // Call custom handler if provided
      if (onMessage) {
        try {
          onMessage(messageData);
        } catch (error) {
          console.error("Error in custom message handler:", error);
        }
      }

      console.log("📩 PostMessage received:", messageData);
    },
    [allowedOrigins, onMessage, storeInLocalStorage, maxStoredMessages]
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);

    // Load existing messages from localStorage on mount
    if (storeInLocalStorage) {
      try {
        const history = JSON.parse(
          localStorage.getItem("postMessageHistory") || "[]"
        );
        setMessages(history);

        const latest = JSON.parse(
          localStorage.getItem("latestPostMessage") || "null"
        );
        setLatestMessage(latest);
      } catch (error) {
        console.error("Error loading messages from localStorage:", error);
      }
    }

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [storeInLocalStorage]);

  // Utility functions
  const clearMessages = useCallback(() => {
    setMessages([]);
    setLatestMessage(null);
    if (storeInLocalStorage) {
      localStorage.removeItem("postMessageHistory");
      localStorage.removeItem("latestPostMessage");
      // Clear individual message items
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("postMessage_")) {
          localStorage.removeItem(key);
        }
      });
    }
  }, [storeInLocalStorage]);

  const markMessageAsProcessed = useCallback((messageId) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, processed: true } : msg
      )
    );
  }, []);

  const sendMessageToParent = useCallback((data, targetOrigin = "*") => {
    if (window.parent) {
      window.parent.postMessage(data, targetOrigin);
      console.log("📤 Message sent to parent:", data);
    }
  }, []);

  return {
    messages,
    latestMessage,
    clearMessages,
    markMessageAsProcessed,
    sendMessageToParent,
  };
};

export default usePostMessage;
