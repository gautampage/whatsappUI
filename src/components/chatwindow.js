"use client";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useEffect, useRef, useState } from "react";
import {
    dispositionApi,
    getDataApi,
    getLLMResponse,
    getMessagesApi,
    readMessagesApi,
    recentMessagesApi,
    sendMessagesApi,
} from "../middleware/chat.service";
import { dateSeperatorMessage, titleCaseString } from "../middleware/common";
import { useLoader } from "../middleware/loader.context";
import { randomUUID } from "../middleware/randomId";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setMessagesSlice } from "../store/slices/chatSlice";
import {
    getLatestDate,
    useLatestCustomerDate,
} from "./../middleware/useLatestCustomerDate";
import { ChatMessageBubble } from "./chatMessageBubble";
import DispositionModal from "./dispositionModal";
import mergeMessages from "./mergeMessage";
import CustomModal from "./modal";
import SlashCommands from "./slashCommands";
import { SubmitIcon, SuggestionIcon } from "./svg-components";
import UserDetailPanel from "./userdetailspanel";

const CURRENT_USER = "AGENT"; // Logged-in user

// Helper function to create request payload with proper identifier fallback
const getRequestPayload = (user, agentId, additionalFields = {}) => {
  const payload = {
    agentId: agentId,
    ...additionalFields,
  };
  
  // Prefer mobileNumber if available, otherwise use customerId
  if (user?.mobileNumber) {
    payload.mobileNumber = user.mobileNumber;
    console.log("✅ Using mobileNumber:", user.mobileNumber);
  } else if (user?.customerId) {
    payload.customerId = user.customerId;
    console.log("⚠️ mobileNumber not found, using customerId:", user.customerId);
  } else {
    console.error("❌ Neither mobileNumber nor customerId found in user object:", user);
  }
  
  console.log("📦 Request payload:", payload);
  return payload;
};

export default function ChatWindow({ selectedUser }) {
  const agentDetails = useAppSelector((state) => state.agentDetails);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const agentIdParam = searchParams.get("agentId");

  const chatSlice = useAppSelector((state) => state.chatSlice);
  const accessPermissions = useAppSelector((state) => state.chatSlice.accessPermissions);
  const [isEnd, setIsEnd] = useState(false);
  const dispatch = useAppDispatch();
  const [suggestedMessages, setSuggestedMessages] = useState([]);
  const containerRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [messages, setMessages] = useState({});
  const previousScrollHeightRef = useRef(0);
  const customerLastSeen = useLatestCustomerDate(chatSlice.messages);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const intervalRef = useRef(null);
  const dataIntervalRef = useRef(null);
  const chatBoxRef = useRef(null);
  const { showLoader, hideLoader } = useLoader();
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [open, setOpen] = useState(false);
  const [showDispositionModal, setShowDispositionModal] = useState(false);
  const [isChatDisposed, setIsChatDisposed] = useState(false);
  const sessionStatus = chatSlice.sessionStatus;

  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [showEnded, setShowEnded] = useState(false);

  // Slash command states
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [slashSearchTerm, setSlashSearchTerm] = useState("");

  // Link mapping for masked links to original links
  const [linkMapping, setLinkMapping] = useState({});

  // ---- Refs to avoid stale closures ----
  const messagesRef = useRef({}); // always keep latest messages here
  const isFetchingRef = useRef(false);
  const initialLoadRef = useRef(true);
  const [showNewMessageBadge, setShowNewMessageBadge] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setShowEnded(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setShowEnded(false);
        setTimeout(() => {
          setShowEnded(true);
        }, [1000]);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("your message is", transcript);
        setInput((prev) => (prev ? prev + " " + transcript : transcript));
      };
      recognitionRef.current = recognition;
    } else {
      alert("Speech recognition is not supported in your browser.");
    }
  }, []);
  useEffect(() => {
    setMessages(chatSlice.messages);
  }, [chatSlice.messages]);

  // Removed useEffect for sessionStatus - using chatSlice.sessionStatus directly. This ensures real-time updates without state sync issues.

  // keep refs in sync whenever state changes
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    isFetchingRef.current = isFetching;
  }, [isFetching]);

  // === Helper that merges and updates state + ref in a single place ===
  const applyMergedMessages = (
    newGroupedMessages,
    { preserveScroll = false } = {}
  ) => {
    const prevScroll = chatBoxRef.current?.scrollHeight || 0;

    // Merge using the latest messages (from ref) to avoid stale closures/races
    const merged = mergeMessages(
      messagesRef.current || {},
      newGroupedMessages || {}
    );

    // Update ref + state
    messagesRef.current = merged;
    // setMessages(merged);
    dispatch(setMessagesSlice(merged));

    // If we are prepending older messages (preserveScroll), restore the scroll
    if (preserveScroll && chatBoxRef.current) {
      // wait for two frames to let DOM paint after react state change
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const nextScroll = chatBoxRef.current?.scrollHeight || 0;
          chatBoxRef.current.scrollTop = nextScroll - prevScroll;
        });
      });
    }
  };

  // ---- Initial read + initial load ----
  const readMsgApi = () => {
    if (!selectedUser) return;

    const requestPayload = getRequestPayload(selectedUser, agentIdParam);
    readMessagesApi(requestPayload).then(async (response) => {
      fetchMsg(); // initial load
    });
  };

  const fetchMsg = async () => {
    if (!selectedUser) return;
    if (isFetchingRef.current) return;

    setIsFetching(true);
    isFetchingRef.current = true;

    const requestPayload = getRequestPayload(selectedUser, agentIdParam);

    try {
      const response = await getMessagesApi(requestPayload);
      console.log("Get messages API response:", response);
      const grouped =
        response?.payload?.groupedMessages ||
        response?.data?.groupedMessages ||
        {};
      console.log("Initial messages grouped:", grouped);
      if (Object.keys(grouped).length > 0) {
        // initial load: replace state without auto-scroll
        applyMergedMessages(grouped, { preserveScroll: false });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetching(false);
      isFetchingRef.current = false;
      hideLoader();
      initialLoadRef.current = false;
    }
  };

  // Polling for recent messages (append at bottom if new)
  const recentMsg = async () => {
    if (!selectedUser) return;

    const requestPayload = getRequestPayload(selectedUser, agentIdParam);

    try {
      const prevNearBottom = chatBoxRef.current
        ? chatBoxRef.current.scrollHeight -
            chatBoxRef.current.scrollTop -
            chatBoxRef.current.clientHeight <=
          100
        : true;

      await recentMessagesApi(requestPayload)
        .then((response) => {
          console.log("Recent messages API response:", response);

          const grouped =
            response?.payload?.groupedMessages ||
            response?.data?.groupedMessages ||
            {};
          console.log("Grouped messages:", grouped);
          if (Object.keys(grouped).length > 0) {
            // Merge new messages
            const merged = mergeMessages(messagesRef.current || {}, grouped);
            console.log("Merged messages:", merged);
            console.log(
              "New messages arrived - Customer last seen:",
              customerLastSeen,
              "Latest message date:",
              getLatestDate(merged)
            );

            if (customerLastSeen !== getLatestDate(merged)) {
              setShowNewMessageBadge(true);
              readMsgApi();
            }
            messagesRef.current = merged;
            // setMessages(merged);

            dispatch(setMessagesSlice(merged));

            // Removed auto-scroll - let user maintain their position
          }
        })
        .catch((err) => {});
    } catch (err) {
      console.error(err);
    } finally {
      hideLoader();
    }
  };

  // Polling for get-data API every 10 seconds
  const pollGetDataApi = async () => {
    if (!selectedUser?.customerId) return;

    const requestPayload = {
      agentId: 1 || agentIdParam,
      customerId: selectedUser.customerId,
    };

    try {
      console.log("Polling get-data API...", requestPayload);
      const response = await getDataApi(requestPayload);

      if (response?.data) {
        console.log("Get-data API response:", response.data);
        // Handle the response data as needed
        // You can dispatch to Redux store or update state here
      }
    } catch (err) {
      console.error("Error calling get-data API:", err);
    }
  };

  function getLatestCustomerMessage(messagesByDate) {
    const allCustomerMessages = [];

    // Iterate through each date group
    Object.values(messagesByDate).forEach((messages) => {
      messages.forEach((msg) => {
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

  const sendMessages = async (message, newLinkMapping) => {
    if (!selectedUser) return;

    const _linkMapping =
      Object.keys(linkMapping) > 0 ? linkMapping : newLinkMapping;

    showLoader();

    // Replace any masked links with original links before sending
    let messageToSend = message;
    console.log("_linkMapping", _linkMapping, newLinkMapping);
    if (!!_linkMapping) {
      Object.keys(_linkMapping).forEach((maskedLink) => {
        if (messageToSend.includes(maskedLink)) {
          messageToSend = messageToSend.replace(
            maskedLink,
            newLinkMapping[maskedLink]
          );
          console.log(
            `Replaced masked link ${maskedLink} with original ${newLinkMapping[maskedLink]}`
          );
        }
      });
    }

    console.log("Original message:", message);
    console.log("Message to send to customer:", messageToSend);

    const requestPayload = getRequestPayload(selectedUser, agentIdParam, {
      senderId: agentIdParam,
      senderRole: "AGENT",
      messageType: "TEXT",
      message: messageToSend, // Send the message with original links
      replyToMessageId: randomUUID(),
    });
    console.log("before send", requestPayload);
    try {
      await sendMessagesApi(requestPayload)
        .then((response) => {
          if (response?.statusMessage && response?.statusCode !== 200) {
            enqueueSnackbar(response.statusMessage, {
              variant: "error",
            });
          }
        })
        .catch((err) => {
          enqueueSnackbar("Something went wrong", {
            variant: "error",
          });
        });
      setInput("");
      // After sending, fetch recent messages without auto-scroll
      setIsAtBottom(true);
      await recentMsg();
    } catch (err) {
      console.error(err);
    } finally {
      hideLoader();
    }
  };

  // ---- Get older messages when scrolled to top ----
  const getNewData = async () => {
    if (!selectedUser?.customerId) return;
    if (isFetchingRef.current) return;

    setIsFetching(true);
    isFetchingRef.current = true;

    const requestPayload = {
      agentId: agentIdParam,
      customerId: selectedUser.customerId,
    };

    const prevScrollHeight = chatBoxRef.current?.scrollHeight || 0;

    try {
      const response = await getMessagesApi(requestPayload);
      console.log("Get older messages API response:", response);
      const grouped =
        response?.payload?.groupedMessages ||
        response?.data?.groupedMessages ||
        {};
      console.log("Older messages grouped:", grouped);
      if (Object.keys(grouped).length > 0) {
        // When loading older messages we want to preserve the current viewport,
        // so pass preserveScroll: true
        applyMergedMessages(grouped, { preserveScroll: true });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetching(false);
      isFetchingRef.current = false;
      hideLoader();
    }
  };

  // Scroll handler reads only from refs - avoids stale closures
  const handleScroll = () => {
    const el = chatBoxRef.current;
    if (!el) return;

    // small threshold to avoid issues with fractional scrollTop
    if (el.scrollTop <= 10 && !isFetchingRef.current) {
      getNewData();
    }
  };

  // Attach scroll listener once per selected chat (attach/detach when selectedUser changes)
  useEffect(() => {
    const el = chatBoxRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [selectedUser?.customerId]);

  useEffect(() => {
    if (!selectedUser?.customerId) return;
    setInput("");

    showLoader();

    // Poll recent-message API every 12 seconds
    intervalRef.current = setInterval(() => {
      recentMsg();
    }, 12000); // every 12 sec for messages

    // Poll get-data API every 20 seconds
    dataIntervalRef.current = setInterval(() => {
      pollGetDataApi();
    }, 20000); // every 20 sec for get-data

    // Initial call to get-data API
    pollGetDataApi();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (dataIntervalRef.current) {
        clearInterval(dataIntervalRef.current);
      }
    };
  }, [selectedUser?.customerId]);

  useEffect(() => {
    if (!selectedUser?.customerId) return;
    (async () => {
      try {
        await readMsgApi();
      } catch (e) {
        console.error(e);
      }
    })();
  }, [selectedUser?.customerId]);

  const translateMessage = (event) => {
    const content = getLatestCustomerMessage(messages);
    const requestPayload = {
      // agentId: 1 || agentIdParam,
      agentMessage: input,
      customerMessage: content?.content || "",
    };
    showLoader();
    getLLMResponse(requestPayload)
      .then((response) => {
        if (response?.data?.suggestedMszList?.length) {
          setSuggestedMessages([...response?.data?.suggestedMszList]);
          setOpen(true);
        }
      })
      .finally(() => {
        hideLoader();
      });
  };

  const handleSuggestion = () => {
    translateMessage();
  };

  const handleDisposition = async (rcodeId, subRcodeId, remarks, dateTime, rcodeName, subRcodeName) => {
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
        enqueueSnackbar("Conversation closed successfully", { variant: "success" });
      } else {
        enqueueSnackbar(response?.statusMessage || "Failed to close conversation", { variant: "error" });
      }
    } catch (error) {
      console.error("❌ Error submitting disposition:", error);
      enqueueSnackbar("Error closing conversation", { variant: "error" });
    } finally {
      hideLoader();
    }
  };

  const scrollToBottom = () => {
    // chatBoxRef.current?.scrollIntoView({ behavior: "smooth" });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (chatBoxRef.current) {
          chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
      });
    });

    // Always stay at bottom
    setIsAtBottom(true);
    setShowNewMessageBadge(false);
  };

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages, isAtBottom]);

  const startDictation = (event) => {
    console.log("im called");
    recognitionRef.current.start();
  };

  useEffect(() => {
    const setBottomScrollactivity = () => {
      const el = chatBoxRef.current;
      if (!el) return;

      const margin = 1; // px tolerance
      if (
        Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) <= margin
      ) {
        setShowNewMessageBadge(false);
      }
    };

    const el = chatBoxRef.current;
    if (el) {
      el.addEventListener("scroll", setBottomScrollactivity);
      setBottomScrollactivity(); // initial check
    }

    return () => el?.removeEventListener("scroll", setBottomScrollactivity);
  }, []);

  // Slash command handlers
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);

    // Check if user typed '/' at the beginning or after a space
    if (value === "/" || value.endsWith(" /")) {
      setShowSlashCommands(true);
      setSlashSearchTerm("");
    } else if (value.includes("/") && showSlashCommands) {
      // Extract search term after the last '/'
      const lastSlashIndex = value.lastIndexOf("/");
      const searchTerm = value.substring(lastSlashIndex + 1);
      setSlashSearchTerm(searchTerm);
    } else if (!value.includes("/")) {
      setShowSlashCommands(false);
      setSlashSearchTerm("");
    }
  };

  const handleSlashCommandSelect = (selectedMessage) => {
    // Replace the '/' command with the selected message
    let newInput = input;
    const lastSlashIndex = input.lastIndexOf("/");
    if (lastSlashIndex !== -1) {
      newInput = input.substring(0, lastSlashIndex) + selectedMessage;
    } else {
      newInput = selectedMessage;
    }

    setInput(newInput);
    setShowSlashCommands(false);
    setSlashSearchTerm("");
  };

  const handlePaymentMessageGenerated = (formattedMessage, newLinkMapping) => {
    console.log("Payment message received in chat window:", formattedMessage);
    console.log("  received:", newLinkMapping);
    setInput(formattedMessage);

    // Update the link mapping
    setLinkMapping((prev) => {
      return { ...prev, ...newLinkMapping };
    });
    sendMessages(formattedMessage, newLinkMapping);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Escape" && showSlashCommands) {
      setShowSlashCommands(false);
      setSlashSearchTerm("");
    } else if (e.key === "Enter") {
      if (showSlashCommands) {
        // Prevent sending message when slash commands are open
        e.preventDefault();
      } else {
        sendMessages(input);
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative ">
      <div
        className={`transition-all duration-300 ${
          showUserDetails ? "w-[calc(100%-20rem)]" : "w-full"
        }`}
      >
        {selectedUser?.customerName && (
          <>
            <div
              className={`sticky top-0 z-10 bg-white  px-4 py-2 flex items-center border-b  border-[#fff] ${
                accessPermissions?.hasProfileAccess ? 'cursor-pointer hover:bg-opacity-80' : 'cursor-not-allowed opacity-90'
              } shadow-[0_2px_2px_-1px_rgba(0,0,0,0.15)]`}
              onClick={() => accessPermissions?.hasProfileAccess && setShowUserDetails(true)}
              title={accessPermissions?.hasProfileAccess ? "Click to view contact info" : "Access denied - Contact info restricted"}
            >
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-base mr-3 flex-shrink-0"
                style={{
                  backgroundColor: selectedUser?.customerName
                    ? `hsl(${
                        (selectedUser.customerName.charCodeAt(0) * 137.5) % 360
                      }, 50%, 50%)`
                    : "#999",
                }}
              >
                {selectedUser?.customerName
                  ? selectedUser.customerName
                      .split(" ")
                      .map((word) => word.charAt(0))
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()
                  : "?"}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm text-gray-800">
                  {titleCaseString(selectedUser?.customerName) || ""}
                </div>
                <div className="text-xs text-gray-500">{customerLastSeen}</div>
              </div>
              
              {/* Disposition Button */}
              {accessPermissions?.hasDispositionAccess && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDispositionModal(true);
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors font-medium text-sm flex items-center gap-2 ml-auto"
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
                  Disposition
                </button>
              )}
            </div>
            <div
              ref={chatBoxRef}
              className="flex-1 w-full overflow-y-auto px-4 py-2  chat-background flex flex-col gap-3 text-sm"
              style={{
                height: "calc(100vh - 130px)",
              }}
            >
              {messages &&
                Object.keys(messages).map((date, index) => {
                  return (
                    <div key={index}>
                      <div
                        key={index}
                        className="relative w-full border-b-gray-500 bottom-1 flex justify-center items-center text-gray-500 text-xs "
                      >
                        <span className="bg-blue-100 px-3 py-1 my-2 rounded-md text-xs  text-gray-900 shadow-[0_2px_2px_-1px_rgba(0,0,0,0.30)]">
                          {dateSeperatorMessage(date)}
                        </span>
                      </div>
                      <div className="">
                        {messages &&
                          !!messages &&
                          date &&
                          Array.isArray(messages[date]) &&
                          messages[date].map((msg, index1) => {
                            return (
                              <ChatMessageBubble
                                key={index1}
                                message={msg.content}
                                fileName={msg.url}
                                sender={msg.sender}
                                senderId={msg.senderId}
                                contentType={msg.contentType}
                                messageStatus={msg.status}
                                timestamp={new Date(
                                  msg.timestamp
                                ).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              />
                            );
                          })}
                      </div>
                    </div>
                  );
                })}
              <div ref={messagesEndRef}></div>
            </div>
            {showNewMessageBadge && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-20 right-4 bg-[#079f9f] text-white px-3 py-1 rounded-full shadow-md"
              >
                ↓ New messages..
              </button>
            )}
            <div className="sticky bottom-0 chat-background  px-4 py-3 flex flex-col w-full items-center gap-2">
              {selectedUser?.name && (
                <div className="h-auto px-2 py-1 rounded text-[#6B5900] text-sm font-light border-amber-200 border flex flex-row justify-center items-center bg-amber-100 text-center">
                  This conversation is being recorded for training and
                  compliance purposes
                </div>
              )}

              {/* ✅ Show inactive session warning */}
              {/* {!sessionStatus && selectedUser?.customerName && (
                <div
                  className="h-auto px-3 py-2 rounded text-sm font-medium border flex flex-row justify-center items-center text-center w-full"
                  style={{
                    backgroundColor: "#fff3cd",
                    borderColor: "#ffc107",
                    color: "#856404",
                  }}
                >
                  ⚠️ Customer session is inactive. Chat input is disabled.
                </div>
              )} */}

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

              {/* Updated: Changed from hidden to disabled state with visual feedback */}
              <div
                className={`flex flex-row gap-2 w-full bg-transparent rounded-full ${
                  !sessionStatus ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <div className="relative flex flex-row gap-2 w-full justify-between items-center">
                  <div className="relative w-full">
                    {/* ✅ Input field with disabled state */}
                    <input
                      type="text"
                      placeholder={
                        isChatDisposed
                          ? "Chat closed - Conversation has been disposed"
                          : sessionStatus
                          ? "Type a message or '/' for quick messages"
                          : "Chat disabled - Customer session inactive"
                      }
                      className="flex-1 w-full text-sm h-10 bg-white border border-[#ddd] rounded-full pl-3 pr-10 py-2 focus:outline-none shadow-[0_1px_1px_rgba(221,221,221,0.40)]"
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleInputKeyDown}
                      disabled={!sessionStatus || isChatDisposed}
                    />

                    {/* Suggestion icon */}
                    <div
                      className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 ${
                        sessionStatus && !isChatDisposed ? "cursor-pointer" : "cursor-not-allowed"
                      }`}
                      onClick={() => sessionStatus && !isChatDisposed && handleSuggestion()}
                      title={
                        isChatDisposed
                          ? "Chat closed"
                          : sessionStatus
                          ? "Translate message to appropriate response"
                          : "Chat disabled"
                      }
                    >
                      <SuggestionIcon />
                    </div>

                    {/* ✅ Slash Commands - only render when session is active */}
                    {sessionStatus && !isChatDisposed && (
                      <SlashCommands
                        isVisible={showSlashCommands}
                        onSelect={handleSlashCommandSelect}
                        onClose={() => setShowSlashCommands(false)}
                        searchTerm={slashSearchTerm}
                        position={{
                          bottom: 50,
                          left: 0,
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* ✅ Send button with disabled state */}
                <button
                  onClick={() => sessionStatus && !isChatDisposed && sendMessages(input)}
                  disabled={!sessionStatus || isChatDisposed}
                  className={`text-white px-2 py-2 rounded-xl transition-colors ${
                    sessionStatus && !isChatDisposed
                      ? "bg-[#079F9F] hover:bg-[#079F9F95] cursor-pointer"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  <SubmitIcon />
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

      {/* Transparent Popup */}
      {isListening && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-black/20 text-white backdrop-blur-md">
            <div className="relative w-52 h-52 flex items-center justify-center">
              {/* Mic waves */}
              <span className="absolute w-16 h-16 rounded-full border border-white animate-ping"></span>
              <span className="absolute w-20 h-20 rounded-full border border-white animate-ping delay-150"></span>
              <span className="absolute w-24 h-24 rounded-full border border-white animate-ping delay-300"></span>
              <span className="text-3xl">🎤</span>
            </div>
            {!showEnded ? (
              <p className="text-lg font-semibold">Listening...</p>
            ) : (
              <p className="text-lg font-semibold">Stopped...</p>
            )}
          </div>
        </div>
      )}

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
