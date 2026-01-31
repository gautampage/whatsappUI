"use client";
import { enqueueSnackbar } from "notistack";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { titleCaseString } from "../middleware/common";
import { useLoader } from "../middleware/loader.context";
import verifyStatusCode from "../middleware/status-code";
import usePostMessage from "../middleware/usePostMessage";
import { useAppSelector } from "../store/hooks";
import {
    clearMessages,
    setActiveChatId,
    setActiveUser,
    setMessagesSlice,
    setOrigMessages,
    setSearchStringRedux,
    setSessionStatus,
} from "../store/slices/chatSlice";
import {
    getUnAssignedMessageApi,
    getUnreadMessageApi,
} from "./../middleware/chat.service";
import useNewMessageTone from "./../middleware/useNotificationTone";
import BubbleTab from "./bubble";
import SearchBox from "./searchBox";
export default function Sidebar({ agentData, accessPermissions }) {
  const [users, setUsers] = useState([]);
  const agentDetails = useAppSelector((state: any) => state.agentDetails);
  const chatSlice = useAppSelector((state: any) => state.chatSlice);
  const [isSearchApplied, setIsSearchApplied] = useState(false);

  const intervalRef = useRef(null);
  const [isFirstRender, setIsFirstRender] = useState(false);
  const [isManualTrigger, setIsManualTrigger] = useState(false);

  const { showLoader, hideLoader } = useLoader();

  // PostMessage integration for sending data to parent
  const { sendMessageToParent } = usePostMessage({
    allowedOrigins: [], // Add your allowed origins here for security
    storeInLocalStorage: false, // Don't store messages from sidebar
  });
  const [origUsers, setOrigUsers] = useState([]);
  const [searchString, setSearchString] = useState("");
  const tabs = ["Self", "Team"];

  const activeChatId = useSelector(
    (state: any) => state.chatSlice.activeChatId
  );
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState("Self");
  const [filterTab, setFilterTab] = useState("all"); // all, unread
  useNewMessageTone(origUsers);

  const handleClick = (tab: string) => {
    setActiveTab(tab);
  };

  const getUnassignedMessage = () => {
    console.log("unassigned message fetched    ");
    if (isFirstRender || isManualTrigger) {
      showLoader();
    }

    const requestPayload = {
      agentId: agentData?.agentId,
      team: "collection",
    };
    
    // If searching, use the same API as Self (getUnreadMessageApi) with just customerId
    if (chatSlice?.searchString) {
      const searchPayload = {
        agentId: agentData?.agentId,
        customerId: chatSlice?.searchString,
      };
      
      console.log("🔍 Team search - calling getUnreadMessageApi (same as Self) with payload:", searchPayload);
      
      getUnreadMessageApi(searchPayload).then((response: any) => {
        setIsFirstRender(false);
        setIsManualTrigger(false);
        console.log("🔍 Team search - response received:", response);

        if (
          response?.statusMessage &&
          ![200, 201].includes(+response?.statusCode)
        ) {
          enqueueSnackbar(response.statusMessage, {
            variant: "error",
          });
          hideLoader();
          return;
        }

        if (response?.payload?.length) {
          const _modifiedRes =
            (response?.payload?.length &&
              response?.payload?.map((user) => {
                user.unreadCount = user.unreadMessageCount;
                return user;
              })) ||
            [];
          console.log("modified", _modifiedRes);
          
          setOrigUsers(_modifiedRes);
          setUsers(_modifiedRes);
          
          if (activeChatId && _modifiedRes.length > 0) {
            const index = _modifiedRes.findIndex(
              (user: any) => user.customerId === activeChatId
            );
            if (index > -1) {
              let timeout1 = setTimeout(() => {
                const __modifiedRes = JSON.parse(JSON.stringify(_modifiedRes));
                setUsers(__modifiedRes);
                setOrigUsers(__modifiedRes);
                clearTimeout(timeout1);
              }, 2000);
            }
          }
          hideLoader();
        } else {
          setUsers([]);
          setOrigUsers([]);
          hideLoader();
        }
      }).catch((error) => {
        console.error("🔍 Team search - API error:", error);
        setIsManualTrigger(false);
        hideLoader();
        enqueueSnackbar("Failed to fetch messages", {
          variant: "error",
        });
      });
      return;
    }

    // Normal Team flow without search - use getUnAssignedMessageApi
    console.log("🔍 Team (no search) - calling getUnAssignedMessageApi with payload:", requestPayload);
    
    getUnAssignedMessageApi(requestPayload).then((response: any) => {
      setIsFirstRender(false);
      setIsManualTrigger(false);
      console.log("🔍 Team search - response received:", response);

      if (
        response?.statusMessage &&
        ![200, 201].includes(+response?.statusCode)
      ) {
        enqueueSnackbar(response.statusMessage, {
          variant: "error",
        });
        hideLoader();
        return;
      }

      if (response?.payload?.length) {
        const _modifiedRes =
          (response?.payload?.length &&
            response?.payload?.map((user) => {
              user.unreadCount = user.unreadMessageCount;
              return user;
            })) ||
          [];
        console.log("modified", _modifiedRes);
        
        setOrigUsers(_modifiedRes);
        setUsers(_modifiedRes);
        
        if (activeChatId && _modifiedRes.length > 0) {
          const index = _modifiedRes.findIndex(
            (user: any) => user.customerId === activeChatId
          );
          if (index > -1) {
            let timeout1 = setTimeout(() => {
              const __modifiedRes = JSON.parse(JSON.stringify(_modifiedRes));
              // __modifiedRes[index].unreadCount = 0;
              setUsers(__modifiedRes);
              setOrigUsers(__modifiedRes);
              clearTimeout(timeout1);
            }, 2000);
          }
        }
        hideLoader();
      } else {
        setUsers([]);
        setOrigUsers([]);
        hideLoader();
      }
    }).catch((error) => {
      console.error("🔍 Team search - API error:", error);      setIsManualTrigger(false);      hideLoader();
      enqueueSnackbar("Failed to fetch team messages", {
        variant: "error",
      });
    });
  };
  const getUnreadMessageApiData = () => {
    if (!agentData?.agentId) return;
    if (isFirstRender || isManualTrigger) {
      showLoader();
    }
    const requestPayload = {
      agentId: agentData?.agentId,
    };
    // ✅ Always include searchString if present
    if (chatSlice?.searchString) {
      requestPayload["customerId"] = chatSlice?.searchString;
    }
    
    console.log("🔍 Self search - calling getUnreadMessageApi with payload:", requestPayload);
    
    getUnreadMessageApi(requestPayload).then((response: any) => {
      setIsFirstRender(false);
      setIsManualTrigger(false);
      console.log("🔍 Self search - response received:", response);

      if (
        response?.statusMessage &&
        ![200, 201].includes(+response?.statusCode)
      ) {
        enqueueSnackbar(response.statusMessage, {
          variant: verifyStatusCode(+response.statusCode) as any,
        });
        hideLoader();
        return;
      }

      if (response?.payload?.length) {
        const _modifiedRes =
          (response?.payload?.length &&
            response?.payload?.map((user) => {
              user.unreadCount = user.unreadMessageCount;
              return user;
            })) ||
          [];
        console.log("modified", _modifiedRes);
        
        setOrigUsers(_modifiedRes);
        setUsers(_modifiedRes);
        
        if (activeChatId && _modifiedRes.length > 0) {
          const index = _modifiedRes.findIndex(
            (user: any) => user.customerId === activeChatId
          );
          if (index > -1) {
            let timeout1 = setTimeout(() => {
              const __modifiedRes = JSON.parse(JSON.stringify(_modifiedRes));
              // __modifiedRes[index].unreadCount = 0;
              setUsers(__modifiedRes);
              setOrigUsers(__modifiedRes);
              clearTimeout(timeout1);
            }, 2000);
          }
        }
        hideLoader();
      } else {
        setUsers([]);
        setOrigUsers([]);
        hideLoader();
      }
    }).catch((error) => {
      console.error("🔍 Self search - API error:", error);
      setIsManualTrigger(false);
      hideLoader();
      enqueueSnackbar("Failed to fetch messages", {
        variant: "error",
      });
    });
  };

  useEffect(() => {
    setIsFirstRender(() => true);
    setIsManualTrigger(true);
    
    // Call API when:
    // 1. Normal load (no search)
    // 2. Backend search needed (chatSlice.searchString has value)
    // 3. Search cleared (searchString empty, will fetch base payload)
    if (activeTab === "Team") {
      getUnassignedMessage();
    } else {
      getUnreadMessageApiData();
    }
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Only set up polling if search is NOT active
    if (!chatSlice?.searchString) {
      intervalRef.current = setInterval(() => {
        if (activeTab === "Team") {
          getUnassignedMessage();
        } else {
          getUnreadMessageApiData();
        }
      }, 30000); // every 30 sec
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [agentData?.agentId, activeTab, chatSlice?.searchString]);

  // Search functionality - always dispatch to backend
  useEffect(() => {
    const searchTerm = searchString.trim();
    
    // Dispatch search term to Redux (empty or with value)
    // This will trigger API call via main useEffect
    if (chatSlice?.searchString !== searchTerm) {
      console.log("🔍 Dispatching search:", searchTerm || "(clearing search)");
      dispatch(setSearchStringRedux(searchTerm));
    }
  }, [searchString]);

  return (
    <div
      className="w-full sm:w-72  md:w-80 lg:w-96 h-screen border-r flex flex-col"
      style={{
        backgroundColor: "var(--wa-panel-background)",
        borderColor: "var(--wa-border)",
      }}
    >
      {/* ✅ Fixed header */}
      <div
        className="p-4 border-b sticky top-0 z-10"
        style={{
          backgroundColor: "var(--wa-panel-background)",
          borderColor: "var(--wa-border)",
        }}
      >
      </div>
      <div style={{ backgroundColor: "var(--wa-panel-background)" }}>
        {/* Only show Self/Team buttons when user has Team access */}
        {accessPermissions?.hasTeamAccess && (
          <div className="flex gap-3 px-4 pt-4 pb-3">
            {tabs
              .filter(tab => tab === "Self" || (tab === "Team" && accessPermissions?.hasTeamAccess))
              .map((tab, index) => {
              const isActive = tab === activeTab;
              return (
                <BubbleTab
                  key={index}
                  isActive={isActive}
                  onChange={handleClick}
                  tab={tab}
                />
              );
            })}
          </div>
        )}

        <div className="flex gap-3 px-4 py-3">
          <SearchBox
            query={searchString}
            placeHolder={"Search by mobile or customerId"}
            onSearch={(event: any) => {
              setSearchString(event);
              // dispatch(setSearchStringRedux(event));
            }}
            sendMessageToParent={sendMessageToParent}
          />
        </div>

        {/* Filter tabs: All and Unread */}
        <div className="flex gap-2 px-4 py-2 border-b" style={{ borderColor: "var(--wa-border)" }}>
          <button
            onClick={() => setFilterTab("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterTab === "all"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterTab("unread")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterTab === "unread"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Unread
          </button>
        </div>
      </div>

      {/* ✅ Scrollable user list */}
      <div
        className="overflow-y-auto flex-1 flex flex-col wa-scrollbar"
        style={{ backgroundColor: "var(--wa-panel-background)" }}
      >
        {users?.length ? (
          users
            .filter((user) => {
              // Filter by unread status
              if (filterTab === "unread") {
                return user.unreadCount > 0;
              }
              return true; // "all" shows everything
            })
            .map((user, index) => {
            const isActive = user.customerId === activeChatId;
            const unreadCount = user.unreadCount;

            const getInitials = (name) => {
              return name
                .split(" ")
                .map((word) => word.charAt(0))
                .join("")
                .substring(0, 2)
                .toUpperCase();
            };

            const getBackgroundColor = (index) => {
              const colors = [
                "#FF6B6B",
                "#4ECDC4",
                "#45B7D1",
                "#96CEB4",
                "#FFEAA7",
                "#DDA0DD",
                "#98D8C8",
                "#F7DC6F",
                "#BB8FCE",
                "#85C1E9",
              ];
              return colors[index % colors.length];
            };

            // Check if priority should be shown (wait time > 1 hour)
            const shouldShowPriority = () => {
              if (!user.waitTime) return false;

              const waitTimeText = user.waitTime.trim();
              console.log(
                "Wait time for",
                user.customerName,
                ":",
                waitTimeText
              ); // Debug log

              // Handle format like "22H 35M", "34M", "1H 15M", etc.
              if (waitTimeText.includes("H")) {
                // Extract hours - any hour value means priority
                const hourMatch = waitTimeText.match(/(\d+)H/);
                if (hourMatch) {
                  const hours = parseInt(hourMatch[1]);
                  console.log("Found hours for", user.customerName, ":", hours); // Debug log
                  return hours >= 1;
                }
              }

              // Handle minutes only format like "34M", "90M"
              if (waitTimeText.includes("M") && !waitTimeText.includes("H")) {
                const minuteMatch = waitTimeText.match(/(\d+)M/);
                if (minuteMatch) {
                  const minutes = parseInt(minuteMatch[1]);
                  console.log(
                    "Found minutes for",
                    user.customerName,
                    ":",
                    minutes
                  ); // Debug log
                  return minutes > 60;
                }
              }

              return false;
            };

            const showPriority = shouldShowPriority();

            return (
              <div
                key={index}
                onClick={() => {
                  // Only clear messages when switching to a DIFFERENT user
                  if (activeChatId !== user.mobileNumber) {
                    dispatch(setMessagesSlice({}));
                    dispatch(setOrigMessages({}));
                    dispatch(clearMessages({}));
                  }
                  // dispatch(setActiveChatId(user.CustomerId));
                  dispatch(setActiveChatId(user.mobileNumber));
                  dispatch(setActiveUser(user));
                  dispatch(setSessionStatus(user.sessionStatus));

                  // Send selected customer data to parent application
                  sendMessageToParent({
                    type: "CUSTOMER_SELECTED",
                    payload: {
                      customerId: user.customerId,
                      mobileNumber: user.mobileNumber,
                      customerName: user.customerName,
                      sessionStatus: user.sessionStatus,
                      unreadCount: user.unreadCount,
                      waitTime: user.waitTime,
                      lastInteractionAt: user.lastInteractionAt,
                      timestamp: new Date().toISOString(),
                    },
                  });

                  console.log("📤 Sent customer selection to parent:", {
                    customerId: user.customerId,
                    mobileNumber: user.mobileNumber,
                    customerName: user.customerName,
                  });

                  console.log("🔍 Full user object being dispatched:", user);

                  setUsers(() => {
                    try {
                      const _prevUsers = JSON.parse(JSON.stringify(users));
                      const userIndex = _prevUsers.findIndex(
                        (_user: any) => _user.customerId === user.customerId
                      );
                      _prevUsers[userIndex].unreadCount = 0;
                      return _prevUsers;
                    } catch (error) {}
                  });
                }}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all"
                style={{
                  backgroundColor: isActive
                    ? "var(--wa-hover)"
                    : "var(--wa-panel-background)",
                  borderLeft: isActive
                    ? "3px solid var(--wa-green)"
                    : "3px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "var(--wa-hover)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor =
                      "var(--wa-panel-background)";
                  }
                }}
              >
                {/* Simple colored avatar */}
                <div className="relative">
                  <div
                    className="h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0"
                    style={{ backgroundColor: getBackgroundColor(index) }}
                  >
                    {getInitials(user.customerName)}
                  </div>
                  {/* Priority indicator for wait time > 1 hour */}
                  {showPriority && (
                    <div
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs border-2 border-white"
                      style={{ backgroundColor: "#FF4444" }}
                    >
                      ⚡
                    </div>
                  )}
                </div>

                {/* Customer info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div
                      className="text-base truncate"
                      style={{
                        color: "var(--wa-text-primary)",
                        fontWeight: user?.unreadCount > 0 ? "500" : "400",
                      }}
                    >
                      {titleCaseString(user.customerName || "")}
                    </div>
                    {/* Priority badge for wait time > 1 hour */}
                    {showPriority && (
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: "#FF444420",
                          color: "#FF4444",
                          border: "1px solid #FF444440",
                        }}
                      >
                        HIGH
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 &&
                  user.waitTime &&
                  user.waitTime !== "0M" ? (
                    <div
                      className="text-sm truncate"
                      style={{
                        color: showPriority
                          ? "#FF4444"
                          : "var(--wa-text-secondary)",
                        fontWeight: showPriority ? "500" : "400",
                      }}
                    >
                      ⏰ Wait time: {user.waitTime}
                    </div>
                  ) : (
                    <div
                      className="text-xs truncate"
                      style={{ color: "var(--wa-text-secondary)" }}
                    >
                      ID: {user.customerId}
                    </div>
                  )}
                </div>

                {/* Right side - unread count and time */}
                <div className="flex flex-col items-end gap-1">
                  {unreadCount > 0 && (
                    <div
                      className="text-xs font-medium rounded-full px-2 py-0.5 min-w-[20px] text-center"
                      style={{
                        backgroundColor: "var(--wa-unread)",
                        color: "white",
                      }}
                    >
                      {unreadCount}
                    </div>
                  )}
                  <div
                    className="text-xs"
                    style={{
                      color:
                        unreadCount > 0
                          ? "var(--wa-unread)"
                          : "var(--wa-text-light)",
                    }}
                  >
                    {user.lastInteractionAt || "12:30 PM"}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div
            className="flex flex-col items-center justify-center h-full py-12 px-4"
            style={{ backgroundColor: "var(--wa-panel-background)" }}
          >
            <div className="text-6xl mb-4" style={{ opacity: 0.3 }}>
              💬
            </div>
            <div
              className="text-lg font-medium mb-2"
              style={{ color: "var(--wa-text-primary)" }}
            >
              No customers found
            </div>
            <div
              className="text-sm text-center max-w-xs"
              style={{ color: "var(--wa-text-secondary)" }}
            >
              {chatSlice?.searchString
                ? "No customers match your search"
                : activeTab === "Team"
                ? "No unassigned messages at the moment"
                : "Your queue is empty"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
