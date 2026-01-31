"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  dispositionApi,
  getLLMResponse,
  getMessagesApi,
  readMessagesApi,
  recentMessagesApi,
  sendMessagesApi,
} from "../middleware/chat.service";
import { titleCaseString } from "../middleware/common";
import { useLoader } from "../middleware/loader.context";
import { randomUUID } from "../middleware/randomId";
import { useSession } from "../middleware/sessionManager";
import usePostMessage from "../middleware/usePostMessage";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setMessagesSlice, setOrigMessages } from "../store/slices/chatSlice";
import DispositionModal from "./dispositionModal";
import CustomModal from "./modal";
import { SessionDetails, SessionIndicator } from "./sessionIndicator";
import UserDetailPanel from "./userdetailspanel";
const CURRENT_USER = "AGENT"; // Logged-in user
export type ChatMessage = {
  content: string;
  contentType: string;
  timestamp: string; // e.g. "Jul 21, 2025, 11:36:08 AM"
  sender: string;
  formattedTime: string;
};
type GroupedMessages = Record<string, ChatMessage[]>; // "21 Jul 2025": [ ... ]

export default function ChatWindow({ selectedUser }) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const agentIdParam = searchParams.get("agentId");
  const agentDetails = useAppSelector((state: any) => state.agentDetails);
  const chatSlice = useAppSelector((state: any) => state.chatSlice);
  const accessPermissions = useAppSelector((state: any) => state.chatSlice.accessPermissions);
  const [isEnd, setIsEnd] = useState(false);
  const dispatch = useAppDispatch();

  // Session management
  const {
    token: sessionToken,
    isValid: isSessionValid,
    sessionInfo,
  } = useSession();

  const [suggestedMessages, setSuggestedMessages] = useState([]);
  const containerRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [messages, setMessages] = useState<GroupedMessages>({});
  const previousScrollHeightRef = useRef(0);

  const intervalRef = useRef(null);
  const chatBoxRef = useRef(null);
  const { showLoader, hideLoader } = useLoader();
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [open, setOpen] = useState(false);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [showDispositionModal, setShowDispositionModal] = useState(false);
  const [isChatDisposed, setIsChatDisposed] = useState(false);

  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // PostMessage integration
  const { latestMessage, sendMessageToParent } = usePostMessage({
    allowedOrigins: [], // Add your allowed origins here
    onMessage: (messageData) => {
      console.log("💬 Chat window received message:", messageData);

      // Handle specific message types for chat
      if (messageData.data.type === "CHAT_COMMAND") {
        const { command, payload } = messageData.data;

        switch (command) {
          case "SEND_MESSAGE":
            if (payload.message) {
              setInput(payload.message);
            }
            break;
          case "UPDATE_CUSTOMER":
            if (payload.customerId) {
              console.log("📱 Update customer requested:", payload.customerId);
              // You can trigger customer change here if needed
            }
            break;
          case "CLEAR_INPUT":
            setInput("");
            break;
          default:
            console.log("❓ Unknown chat command:", command);
        }
      }
    },
  });

  // Send notification to parent about chat events
  const notifyParent = (eventType, data) => {
    sendMessageToParent({
      type: "CHAT_EVENT",
      payload: {
        eventType,
        data,
        timestamp: new Date().toISOString(),
        customerId: selectedUser?.customerId,
      },
    });
  };
  useEffect(() => {
    console.log(chatBoxRef.current);

    // Removed auto-scroll behavior
    if (chatBoxRef.current) {
      console.log(chatBoxRef.current.scrollHeight);
    }
  }, [messages]);

  // Handle postMessage data for chat commands
  useEffect(() => {
    if (latestMessage && latestMessage.data.type === "CHAT_COMMAND") {
      const { command, payload } = latestMessage.data;
      console.log(`🎮 Executing chat command: ${command}`, payload);
    }
  }, [latestMessage]);

  // Log session information when it changes
  useEffect(() => {
    if (sessionToken) {
      console.log("🔐 Session token available:", sessionToken);
      console.log("📊 Session info:", sessionInfo);

      // Notify parent about session status
      notifyParent("SESSION_UPDATED", {
        hasToken: !!sessionToken,
        isValid: isSessionValid,
        sessionInfo: sessionInfo,
      });
    }
  }, [sessionToken, sessionInfo, isSessionValid]);
  const readMsgApi = () => {
    if (!selectedUser) return;

    const requestPayload = {
      agentId: agentIdParam,
      customerId: selectedUser.customerId,
    };
    readMessagesApi(requestPayload).then((response: any) => {});
  };

  const fetchMsg = () => {
    if (!selectedUser) return;
    if (isFetching) return;
    setIsFetching(true);
    const prevScrollHeight = chatBoxRef.current.scrollHeight;

    const requestPayload = {
      agentId: agentIdParam,
      customerId: selectedUser.customerId,
    };
    getMessagesApi(requestPayload)
      .then((response: any) => {
        if (Object.keys(response?.data?.groupedMessages)?.length > 0) {
          const obj = JSON.parse(JSON.stringify(response));
          mergeChats(obj);
        }
        setIsFetching(false);
        setTimeout(() => {
          if (chatBoxRef.current) {
            const newScrollHeight = chatBoxRef.current.scrollHeight;
            chatBoxRef.current.scrollTop =
              newScrollHeight - prevScrollHeight + chatBoxRef.current.scrollTop;
          }
        }, 0);
      })
      .finally(() => {
        hideLoader();
      });
  };

  const mergeMessages = (
    oldData: GroupedMessages,
    newData: GroupedMessages
  ) => {
    console.log("initial data", oldData, newData);
    const merged: GroupedMessages = chatSlice.messages
      ? Object.fromEntries(
          Object.entries(chatSlice.messages).map(([date, msgs]: any) => [
            date,
            [...msgs], // clone array
          ])
        )
      : {};
    console.log(merged);

    Object.entries(newData).forEach(([dateKey, msgs]) => {
      const _msgs = JSON.parse(JSON.stringify(msgs));
      if (!merged[dateKey]) {
        merged[dateKey] = [..._msgs];
        console.log(merged[dateKey]);
      } else {
        // Avoid duplicates by timestamp+sender+content
        const existingSet = new Set(
          merged[dateKey].map((m) => `${m.timestamp}`)
        );
        console.log("existingSet", existingSet);
        _msgs.forEach((msg) => {
          const id = `${msg.timestamp}`;
          if (!existingSet.has(id)) {
            merged[dateKey] = [...merged[dateKey], msg]; // make a new array
          }
        });

        // Sort inner messages by timestamp ASC
        merged[dateKey].sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        console.log(merged[dateKey]);
      }
    });

    return merged;
  };

  // Helper: Sort outer groups by date ASC
  const sortGroupedMessages = (data: GroupedMessages) => {
    const sortedKeys = Object.keys(data).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );
    const sortedObj: GroupedMessages = {};

    sortedKeys.forEach((key) => {
      sortedObj[key] = [...data[key]].sort(
        (m1: any, m2: any) => m2.timestamp - m1.timestamp
      );
    });
    console.log(sortedObj);
    return sortedObj;
  };
  const mergeChats = (response: any) => {
    console.log(response);
    setIsEnd(response?.data?.hasMore);
    if (
      Object.keys(response?.data?.groupedMessages)?.length > 0 &&
      response?.data?.hasMore
    ) {
      const storedObject = JSON.parse(
        JSON.stringify(response?.data?.groupedMessages)
      );
      let newChatObj: GroupedMessages = sortGroupedMessages(
        mergeMessages(messages, storedObject)
      );
      console.log("newChatObj", newChatObj);
      setMessages((prev) => {
        return newChatObj;
      });
      dispatch(setMessagesSlice(newChatObj));
      dispatch(setOrigMessages(newChatObj));
    }
  };
  const recentMsg = () => {
    if (!selectedUser) return;

    const requestPayload = {
      agentId: agentIdParam,
      customerId: selectedUser.customerId,
    };
    recentMessagesApi(requestPayload)
      .then((response: any) => {
        const obj = JSON.parse(JSON.stringify(response));
        if (Object.keys(response?.data?.groupedMessages)?.length > 0) {
          mergeChats(obj);
        }
      })
      .finally(() => {
        hideLoader();
      });
  };

  const sendMessages = (message: string) => {
    if (!selectedUser) return;

    showLoader();

    const requestPayload = {
      customerId: selectedUser?.customerId,
      senderId: 1 || agentIdParam,
      senderRole: "AGENT",
      messageType: "TEXT",
      message: message,
      replyToMessageId: randomUUID(),
      // mediaId: "64b8f5a7d4e9a32a6c6b1234",
      // mediaMimeType: "image/png",
    };
    sendMessagesApi(requestPayload)
      .then((response: any) => {
        // recentMsg();
        // readMsgApi();
        recentMsg(); // initial load
      })
      .finally(() => {
        hideLoader();
      });
  };

  useEffect(() => {
    if (chatSlice?.messages && Object.keys(chatSlice?.messages)) {
      console.log("chatSlice.messages", chatSlice.messages);
      setMessages(chatSlice.messages);
    }
  }, [chatSlice.messages]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);

    // Simulate suggestion logic
    const allSuggestions = [];
    if (val.length > 1) {
      setSuggestions(
        allSuggestions.filter((s) =>
          s.toLowerCase().includes(val.toLowerCase())
        )
      );
    } else {
      setSuggestions([]);
    }
  };

  const sendMessage = () => {
    if (!input.trim()) return;

    // Send message through existing API
    sendMessages(input);

    // Notify parent about message sent
    notifyParent("MESSAGE_SENT", {
      message: input,
      customerId: selectedUser?.customerId,
      timestamp: new Date().toISOString(),
    });

    setInput("");
    setSuggestions([]);
  };

  const handleSend = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  useEffect(() => {
    if (!selectedUser?.customerId) return;
    showLoader();

    // Notify parent about customer change
    notifyParent("CUSTOMER_CHANGED", {
      customerId: selectedUser.customerId,
      customerName: selectedUser.customerName,
    });

    // readMsgApi();
    // recentMsg();

    intervalRef.current = setInterval(() => {
      // readMsgApi();
      recentMsg();
    }, 10000); // every 10 sec

    return () => clearInterval(intervalRef.current);
  }, [selectedUser?.customerId]);

  useEffect(() => {
    const container = chatBoxRef.current;

    const handleScroll = async () => {
      if (container.scrollTop === 0 && !isFetching) {
        const prevScrollHeight = container.scrollHeight;
        setIsFetching(true);

        const requestPayload = {
          agentId: agentIdParam,
          customerId: selectedUser.customerId,
        };

        try {
          getMessagesApi(requestPayload).then((response) => {
            const newGroupedMessages = response?.data?.groupedMessages || {};
            const obj = JSON.parse(JSON.stringify(response));
            if (Object.keys(response?.data?.groupedMessages)?.length > 0) {
              mergeChats(obj);
            }

            if (Object.keys(newGroupedMessages).length > 0) {
              // Store the current scroll height and top before update
              const prevScrollTop = prevScrollHeight;
              setIsFetching(false);

              // Delay to allow DOM to update
              setTimeout(() => {
                const newScrollHeight = container.scrollHeight;
                container.scrollTop =
                  newScrollHeight - prevScrollHeight + prevScrollTop;
              }, 0); // wait for DOM
            }
          });
        } finally {
          hideLoader();
          setIsFetching(false);
        }
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!selectedUser?.customerId) return;

    new Promise((resolve, reject) => {
      resolve(readMsgApi());
    })
      .then(() => {
        fetchMsg(); // initial load
      })
      .catch((error) => {
        console.error(error);
      });
  }, [selectedUser?.customerId]);
  function getLatestCustomerMessage(messagesByDate: any) {
    const allCustomerMessages = [];

    // Iterate through each date group
    Object.values(messagesByDate).forEach((messages: any) => {
      messages.forEach((msg: any) => {
        if (msg.sender === "CUSTOMER") {
          allCustomerMessages.push(msg);
        }
      });
    });

    // Sort customer messages by timestamp descending
    allCustomerMessages.sort(
      (a, b) =>
        new Date(b.timestamp).valueOf() - new Date(a.timestamp).valueOf()
    );

    // Return the latest one, or null if none exist
    return allCustomerMessages[0] || null;
  }

  const handlePaymentMessageGenerated = (message: string, linkMapping: any) => {
    // Set the payment message in the input field
    setInput(message);
    // You could also store the linkMapping if needed for payment link masking
    console.log("Payment message generated:", message);
    console.log("Link mapping:", linkMapping);
  };

  const translateMessage = (event) => {
    const content = getLatestCustomerMessage(messages);
    const requestPayload = {
      // agentId: 1 || agentIdParam,
      agentMessage: input,
      customerMessage: content?.content || "",
    };
    showLoader();
    getLLMResponse(requestPayload)
      .then((response: any) => {
        if (response?.data?.suggestedMszList?.length) {
          setSuggestedMessages([...response?.data?.suggestedMszList]);
          setOpen(true);
        }
      })
      .finally(() => {
        hideLoader();
      });
  };

  const handleDisposition = async (rcodeId: number, subRcodeId?: number, remarks?: string, dateTime?: string, rcodeName?: string, subRcodeName?: string) => {
    if (!selectedUser) return;

    try {
      showLoader();
      const requestPayload = {
        requestFor: "CLOSE_CONVERSATION",
        team: agentDetails?.team || "COLLECTION",
        agentId: agentIdParam,
        customerId: selectedUser.customerId || selectedUser.mobileNumber,
        rcodeID: rcodeId,
        ...(subRcodeId && { subRcodeID: subRcodeId }),
        ...(remarks && { remarks: remarks }),
        ...(dateTime && { dateTime: dateTime }),
        ...(rcodeName && { rcode: rcodeName }),
        ...(subRcodeName && { subRcode: subRcodeName }),
      };

      const response = await dispositionApi(requestPayload);

      if (response?.statusCode && [200, 201].includes(+response.statusCode)) {
        console.log("✅ Disposition submitted successfully");
        setShowDispositionModal(false);
        setIsChatDisposed(true);
        // Optionally notify parent or refresh chat list
        notifyParent("DISPOSITION_CLOSED", {
          customerId: selectedUser.customerId,
          rcodeId,
        });
      } else {
        alert(response?.statusMessage || "Failed to close conversation");
      }
    } catch (error) {
      console.error("❌ Error submitting disposition:", error);
      alert("Error closing conversation");
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    console.log(messages);
  }, [messages]);

  function ChatMessageBubble({
    message,
    sender = "AGENT",
    timestamp,
    messageStatus = "read",
  }) {
    const isOutgoing = sender === "AGENT";

    // Force re-render - WhatsApp Web exact colors and styling
    const bubbleStyles = isOutgoing
      ? {
          backgroundColor: "#dcf8c6",
          borderRadius: "7.5px",
          borderBottomRightRadius: "0px",
          maxWidth: "50%",
          marginLeft: "auto",
          marginRight: "8px",
          marginBottom: "16px",
        }
      : {
          backgroundColor: "#ffffff",
          borderRadius: "7.5px",
          borderBottomLeftRadius: "0px",
          maxWidth: "50%",
          marginLeft: "8px",
          marginRight: "auto",
          marginBottom: "16px",
        };

    const getStatusIcon = () => {
      if (!isOutgoing) return null;

      switch (messageStatus) {
        case "sent":
          return (
            <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
              <path
                d="M11.1 0.3L4.3 6.6L1.8 4.2L0.5 5.5L4.3 9.7L12.5 1.5L11.1 0.3Z"
                fill="#53bdeb"
              />
            </svg>
          );
        case "delivered":
          return (
            <svg width="18" height="10" viewBox="0 0 18 10" fill="none">
              <path
                d="M16.1 0.3L9.3 6.6L6.8 4.2L5.5 5.5L9.3 9.7L17.5 1.5L16.1 0.3Z"
                fill="#53bdeb"
              />
              <path
                d="M11.1 0.3L4.3 6.6L1.8 4.2L0.5 5.5L4.3 9.7L12.5 1.5L11.1 0.3Z"
                fill="#53bdeb"
              />
            </svg>
          );
        case "read":
          return (
            <svg width="18" height="10" viewBox="0 0 18 10" fill="none">
              <path
                d="M16.1 0.3L9.3 6.6L6.8 4.2L5.5 5.5L9.3 9.7L17.5 1.5L16.1 0.3Z"
                fill="#53bdeb"
              />
              <path
                d="M11.1 0.3L4.3 6.6L1.8 4.2L0.5 5.5L4.3 9.7L12.5 1.5L11.1 0.3Z"
                fill="#53bdeb"
              />
            </svg>
          );
        default:
          return null;
      }
    };

    return (
      <div
        className={`flex w-full ${
          isOutgoing ? "justify-end" : "justify-start"
        }`}
      >
        <div
          style={{
            ...bubbleStyles,
            padding: "6px 7px 8px 9px",
            boxShadow: "0 1px 0.5px rgba(0,0,0,0.13)",
            position: "relative",
            wordWrap: "break-word",
            wordBreak: "break-word",
            paddingBottom: "18px", // Extra padding for timestamp overlay
          }}
        >
          {/* Message text */}
          <div
            style={{
              fontSize: "14.2px",
              lineHeight: "19px",
              color: "#111b21",
              fontFamily:
                "Segoe UI, Helvetica Neue, Helvetica, Lucida Grande, Arial, Ubuntu, Cantarell, Fira Sans, sans-serif",
              whiteSpace: "pre-wrap",
              display: "inline",
            }}
          >
            {message}
            {/* Timestamp and status inline at the end of the message */}
            <span style={{ whiteSpace: "nowrap", marginLeft: "8px" }}>
              <span
                style={{
                  fontSize: "11px",
                  color: "#53bdeb",
                  lineHeight: "15px",
                  fontFamily:
                    "Segoe UI, Helvetica Neue, Helvetica, Lucida Grande, Arial, Ubuntu, Cantarell, Fira Sans, sans-serif",
                  marginRight: "3px",
                }}
              >
                {timestamp || "10:34 AM"}
              </span>
              {getStatusIcon()}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full relative">
      <div
        className={`transition-all duration-300 ${
          showUserDetails ? "w-[calc(100%-20rem)]" : "w-full"
        }`}
      >
        {selectedUser?.customerName && (
          <>
            {/* 🧩 Top Fixed Header */}
            <div
              className={`sticky top-0 z-10 px-4 py-3 flex items-center border-b ${
                accessPermissions?.hasProfileAccess ? 'cursor-pointer hover:bg-opacity-80' : 'cursor-not-allowed opacity-90'
              }`}
              style={{
                backgroundColor: "var(--wa-panel-background)",
                borderColor: "var(--wa-border)",
              }}
              onClick={() => accessPermissions?.hasProfileAccess && setShowUserDetails(true)}
              title={accessPermissions?.hasProfileAccess ? "Click to view contact info" : "Access denied - Contact info restricted"}
            >
              <img
                src="https://i.pravatar.cc/52"
                alt="avatar"
                className="h-10 w-10 rounded-full mr-3"
              />
              <div className="flex-1">
                <div
                  className="font-medium text-base"
                  style={{ color: "var(--wa-text-primary)" }}
                >
                  {titleCaseString(selectedUser?.customerName) || ""}
                </div>
                <div
                  className="text-sm"
                  style={{ color: "var(--wa-text-secondary)" }}
                >
                  last seen today at 11:34 AM
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Dispose & Close Button */}
                <button
                  onClick={() => setShowDispositionModal(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors font-medium text-sm flex items-center gap-2"
                  title="Close conversation"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Dispose & Close
                </button>

                <div
                  className="w-6 h-6 cursor-pointer"
                  style={{ color: "var(--wa-text-secondary)" }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.9 14.3H15l-.3-.3c1-1.1 1.6-2.7 1.6-4.3 0-3.7-3-6.7-6.7-6.7S3 6 3 9.7s3 6.7 6.7 6.7c1.6 0 3.2-.6 4.3-1.6l.3.3v.8l5.1 5.1 1.5-1.5-5.2-5zm-6.2 0c-2.6 0-4.6-2.1-4.6-4.6s2.1-4.6 4.6-4.6 4.6 2.1 4.6 4.6-2 4.6-4.6 4.6z" />
                  </svg>
                </div>
                <div
                  className="w-6 h-6 cursor-pointer"
                  style={{ color: "var(--wa-text-secondary)" }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                  </svg>
                </div>
              </div>

              {/* Session Indicator */}
              <div
                className="cursor-pointer"
                onClick={() => setShowSessionDetails(true)}
              >
                <SessionIndicator />
              </div>
            </div>

            {/* 💬 Scrollable Chat Area */}
            <div
              ref={chatBoxRef}
              className="flex-1 w-full overflow-y-auto px-3 py-1 flex flex-col text-sm wa-scrollbar"
              style={{
                height: "calc(100vh - 130px)",
                backgroundColor: "var(--wa-chat-background)",
                backgroundImage:
                  'url("data:image/svg+xml,%3csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3e%3cdefs%3e%3cpattern id="a" patternUnits="userSpaceOnUse" width="40" height="40" patternTransform="scale(0.5) rotate(0)"%3e%3crect x="0" y="0" width="100%25" height="100%25" fill="%23efeae2"%3e%3c/rect%3e%3cpath d="M0 40L40 0L80 40L40 80z" stroke-width="0.5" stroke="%23f5f1eb" fill="none"%3e%3c/path%3e%3c/pattern%3e%3c/defs%3e%3crect width="100%25" height="100%25" fill="url(%23a)"%3e%3c/rect%3e%3c/svg%3e")',
                backgroundSize: "40px 40px",
              }}
            >
              {messages &&
                Object.keys(messages).map((date, index) => {
                  return (
                    <div key={index}>
                      <div
                        key={index}
                        className="relative w-full my-3 flex justify-center items-center"
                      >
                        <div
                          className="px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{
                            backgroundColor: "#ffffff",
                            color: "#667781",
                            boxShadow: "0 1px 0.5px rgba(0,0,0,.13)",
                            border: "1px solid #f0f2f5",
                          }}
                        >
                          {date}
                        </div>
                      </div>
                      <div className="">
                        {messages &&
                          !!messages &&
                          date &&
                          Array.isArray(messages[date]) &&
                          messages[date]
                            // .sort((a: any, b: any) => a.timestamp - b.timestamp)
                            .map((msg: any, index1: any) => {
                              const isUser = msg.sender === CURRENT_USER;
                              // Determine message status - you can enhance this based on your API data
                              const getMessageStatus = () => {
                                if (msg.sender === "CUSTOMER") return undefined; // No status for incoming messages
                                if (msg.readStatus === "read") return "read";
                                if (msg.deliveryStatus === "delivered")
                                  return "delivered";
                                return "sent";
                              };

                              return (
                                <ChatMessageBubble
                                  key={index1}
                                  message={msg.content}
                                  sender={msg.sender}
                                  timestamp={new Date(
                                    msg.timestamp
                                  ).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                  messageStatus={getMessageStatus()}
                                />
                              );
                            })}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* 📝 Input Box Fixed at Bottom */}
            <div
              className="sticky bottom-0 px-4 py-3 flex flex-col w-full items-center gap-2"
              style={{ backgroundColor: "var(--wa-panel-background)" }}
            >
              {selectedUser?.name && (
                <div
                  className="h-auto px-3 py-2 rounded text-sm font-normal border flex flex-row justify-center items-center text-center"
                  style={{
                    color: "#8a5c00",
                    backgroundColor: "#fff3cd",
                    borderColor: "#ffeaa7",
                  }}
                >
                  This conversation is being recorded for training and
                  compliance purposes
                </div>
              )}
              {suggestions.length > 0 && (
                <div className="absolute bg-white border border-gray-200 rounded shadow-lg p-2 z-10 w-full max-h-40 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setInput(suggestion);
                        setSuggestions([]);
                      }}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-row gap-3 w-full items-end">
                <div className="relative flex flex-row gap-2 w-full justify-between items-center">
                  <div className="relative w-full">
                    <input
                      type="text"
                      placeholder="Type a message"
                      className="flex-1 w-full border rounded-full px-4 py-3 pr-12 focus:outline-none text-base"
                      style={{
                        backgroundColor: "var(--wa-panel-background)",
                        borderColor: "var(--wa-border)",
                        color: "var(--wa-text-primary)",
                      }}
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        handleInputChange(e);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    />

                    <div
                      className="absolute right-12 top-1/2 transform -translate-y-1/2 cursor-pointer"
                      style={{ color: "var(--wa-text-secondary)" }}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.35 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2.001z" />
                      </svg>
                    </div>
                    <div
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                      onClick={translateMessage}
                      title={"AI suggested responses"}
                      style={{ color: "var(--wa-text-secondary)" }}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <button
                  onClick={sendMessage}
                  className="rounded-full p-3 transition-colors"
                  style={{
                    backgroundColor: input.trim()
                      ? "var(--wa-green)"
                      : "var(--wa-text-light)",
                    color: "white",
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      {open && (
        <CustomModal
          onClose={() => setOpen(false)}
          title={"Select appropriate message"}
        >
          <div className="flex flex-col w-[500px]">
            <div className="flex flex-col gap-2 bg-white h-52 max-h-52 overflow-y-auto">
              {suggestedMessages?.length
                ? suggestedMessages?.map((msg, index) => {
                    return (
                      <div
                        key={index}
                        className={`relative flex p-2 border border-[#e6e6e6] rounded-md cursor-pointer hover:bg-gray-300 ${
                          selected == msg ? "bg-gray-300" : ""
                        }`}
                        onClick={() => {
                          setInput(msg);
                          setOpen(false);
                        }}
                      >
                        {msg}
                      </div>
                    );
                  })
                : null}
            </div>
            <div className="flex gap-2 justify-end items-center mt-4 hidden">
              <button
                className="bg-[#079f9f] text-white px-2 py-1 rounded cursor-pointer w-20 text-base"
                onClick={() => setSelected(null)}
              >
                Cancel
              </button>
              <button
                className="bg-[#079f9f] text-white px-2 py-1 rounded  cursor-pointer w-20 text-base"
                onClick={() => {
                  setInput(selected);
                  setOpen(false);
                }}
              >
                Ok
              </button>
            </div>
          </div>
        </CustomModal>
      )}
      {showUserDetails && accessPermissions?.hasProfileAccess && (
        <div className="w-80 bg-white border-l shadow-xl transition-all duration-300">
          <UserDetailPanel
            visible={showUserDetails}
            onClose={() => setShowUserDetails(false)}
            user={selectedUser}
            onPaymentMessageGenerated={handlePaymentMessageGenerated}
          />
        </div>
      )}

      {/* Session Details Modal */}
      <SessionDetails
        isOpen={showSessionDetails}
        onClose={() => setShowSessionDetails(false)}
      />

      {/* Disposition Modal */}
      <DispositionModal
        isOpen={showDispositionModal}
        onClose={() => setShowDispositionModal(false)}
        onSubmit={handleDisposition}
        agentId={agentIdParam}
        team={agentDetails?.team || "COLLECTION"}
      />
    </div>
  );
}
