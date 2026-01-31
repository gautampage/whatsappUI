import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLoader } from "../middleware/loader.context";
import verifyStatusCode from "../middleware/status-code";
import { useAppSelector } from "../store/hooks";
import {
    getCustomerDetailsApi,
    getSynopsisApi,
    sendRepaymentLinkApi,
} from "./../middleware/chat.service";
import {
    convertISOToDateString,
    formatIndianCurrency,
    titleCaseString,
} from "./../middleware/common";
import BubbleTab from "./bubble";
import MediaPopup from "./mediaPopup";
const userObj = {
  name: "",
  customerId: "",
  dpd: 0,
  lastPaymentDate: "",
  lastPaymentAmount: 0,
};

export const UserDetailPanel = ({
  visible,
  onClose,
  user,
  onPaymentMessageGenerated,
}) => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const agentIdParam = searchParams.get("agentId");
  const chatSlice = useAppSelector((state) => state.chatSlice);
  const [repaymentLink, setRepaymentLink] = useState("");
  const [imgError, setImgError] = useState(false);
  const drawerRef = useRef(null);
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [synopsisData, setSynopsisData] = useState(null);
  const [synopsisLoading, setSynopsisLoading] = useState(false);

  // Store the mapping of masked links to original links
  const [linkMapping, setLinkMapping] = useState({});

  const agentDetails = useAppSelector((state) => state.agentDetails);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const linkOptionsNew = [
    { key: "overdueAmount", label: "Overdue" },
    { key: "overdueEmiAmount", label: "EMI" },
    { key: "custom", label: "Enter Manual" },
  ];
  const [copied, setCopied] = useState(false);

  // const linkOptions = ["Overdue", "EMI", "Enter Manual"];
  const [activeLink, setActiveLink] = useState();
  const [customerDetails, setCustomerDetails] = useState(null);
  const [showMediaPopup, setShowMediaPopup] = useState(false);
  const [popupMediaData, setPopupMediaData] = useState(null);
  const { showLoader, hideLoader } = useLoader();

  // Function to mask the payment link for display purposes
  const maskPaymentLink = useCallback((url) => {
    if (!url) return "";

    console.log("Original URL to mask:", url);

    try {
      // For the specific format: https://rzp.io/rzp/ljUJVdB
      if (url.includes("rzp.io/rzp/")) {
        const parts = url.split("/");
        console.log("URL parts:", parts);

        // Should be: ['https:', '', 'rzp.io', 'rzp', 'ljUJVdB']
        if (parts.length >= 5) {
          const token = parts[4]; // The token part: 'ljUJVdB'
          console.log("Token to mask:", token);

          if (token && token.length > 4) {
            // Always mask at least 4 characters
            const visibleChars = Math.max(
              1,
              Math.floor((token.length - 4) / 2)
            );
            const firstPart = token.substring(0, visibleChars);
            const lastPart = token.substring(token.length - visibleChars);
            const maskedPart = "*".repeat(
              Math.max(4, token.length - 2 * visibleChars)
            );

            const maskedToken = firstPart + maskedPart + lastPart;
            const maskedUrl = `${parts[0]}//${parts[2]}/${parts[3]}/${maskedToken}`;
            console.log("Masked URL:", maskedUrl);
            return maskedUrl;
          } else {
            // For very short tokens, mask all but first and last character
            const firstPart = token.substring(0, 1);
            const lastPart = token.substring(token.length - 1);
            const maskedToken =
              firstPart + "*".repeat(Math.max(4, token.length - 2)) + lastPart;

            const maskedUrl = `${parts[0]}//${parts[2]}/${parts[3]}/${maskedToken}`;
            console.log("Masked URL (short token):", maskedUrl);
            return maskedUrl;
          }
        }
      }

      // Fallback for other URL patterns
      console.log("Using fallback masking logic");
      const parts = url.split("/");
      const lastPart = parts[parts.length - 1];

      if (lastPart && lastPart.length > 2) {
        const visibleChars = Math.max(1, Math.floor((lastPart.length - 4) / 2));
        const firstPart = lastPart.substring(0, visibleChars);
        const endPart = lastPart.substring(lastPart.length - visibleChars);
        const maskedPart = "*".repeat(
          Math.max(4, lastPart.length - 2 * visibleChars)
        );

        const maskedToken = firstPart + maskedPart + endPart;
        parts[parts.length - 1] = maskedToken;
        const maskedUrl = parts.join("/");
        console.log("Fallback masked URL:", maskedUrl);
        return maskedUrl;
      }

      console.log("No masking applied, returning original URL");
      return url;
    } catch (error) {
      console.error("Error masking URL:", error);
      return url;
    }
  }, []);

  const openMediaPopup = (type, url, name = null, size = null) => {
    console.log("Opening media popup:", { type, url, name }); // Debug log
    setPopupMediaData({
      type,
      url,
      name: name || url.split("/").pop(),
      size,
    });
    setShowMediaPopup(true);
    console.log("Media popup should be open now"); // Debug log
  };

  const getSynopsisDetails = async (customerId) => {
    const payload = {
      customerId: customerId,
      team: "COLLECTION",
      agentId: agentIdParam || 1,
    };

    setSynopsisLoading(true);
    try {
      console.log("Calling synopsis API with payload:", payload);
      const response = await getSynopsisApi(payload);
      console.log("Synopsis API response:", response);

      const variant = verifyStatusCode(+response.statusCode);
      if (variant === "error") {
        enqueueSnackbar(
          response?.statusMessage || "Error while getting synopsis",
          {
            variant: variant,
            autoHideDuration: 3000,
          }
        );
        setSynopsisData(null);
        return;
      }

      if (response?.data) {
        setSynopsisData(response.data);
        enqueueSnackbar("Synopsis loaded successfully", {
          variant: "success",
          autoHideDuration: 2000,
        });
      } else {
        setSynopsisData(null);
        console.log("No synopsis data in response");
      }
    } catch (error) {
      console.error("Error fetching synopsis:", error);
      setSynopsisData(null);
      enqueueSnackbar("Failed to load synopsis", {
        variant: "error",
        autoHideDuration: 3000,
      });
    } finally {
      setSynopsisLoading(false);
    }
  };

  const getCustomerDetails = (customerId) => {
    const customer = {
      customerId: customerId,
      agentId: 1 || agentIdParam,
    };
    showLoader(true);
    getCustomerDetailsApi(customer)
      .then((response) => {
        const variant = verifyStatusCode(+response.statusCode);
        if (variant === "error") {
          enqueueSnackbar(
            response?.statusMessage || "Error while getting customer details",
            {
              variant: variant,
              autoHideDuration: 3000,
            }
          );
          setCustomerDetails(userObj);
          hideLoader();
          return;
        }
        if (response?.data?.customerLosData) {
          const { customerLosData, customerLmsData } = { ...response?.data };
          console.log(customerLmsData);
          const payload = {
            customerId: customerId,
            name: customerLosData?.name + " " + customerLosData?.lastName,
            profilePicture: customerLosData?.profilePicture,
            dpd: customerLmsData?.customerUnsecuredLmsData?.dpd,
            campaignName:
              customerLmsData?.customerUnsecuredLmsData?.campaignName,
            lastPaymentDate:
              customerLmsData?.customerUnsecuredLmsData.lastPaymentDate,
            lastPaymentAmount:
              customerLmsData?.customerUnsecuredLmsData?.lastPaymentAmount,
            product: customerLmsData?.customerUnsecuredLmsData?.productType,
            principleOutstanding:
              customerLmsData?.customerUnsecuredLmsData?.principleOutstanding,
            totalOutstanding:
              customerLmsData?.customerUnsecuredLmsData?.totalOutstanding,
            emiAmount: customerLmsData?.customerUnsecuredLmsData?.emiAmount,
            overdueEmiAmount:
              customerLmsData?.customerUnsecuredLmsData?.overdueEmiAmount,
            overdueAmount:
              customerLmsData?.customerUnsecuredLmsData?.overdueAmount,
            totalCharge:
              customerLmsData?.customerUnsecuredLmsData?.totalCharges,
          };
          console.log(response?.data, payload);
          setCustomerDetails(payload);
          hideLoader();
        } else {
          setCustomerDetails({});
          hideLoader();
        }
      })
      .catch((error) => {
        hideLoader();
      });
  };

  const sendRepaymentLink = useCallback(() => {
    if (!selectedAmount || selectedAmount <= 0) return;
    const customer = {
      customerId: user?.customerId,
      amount: selectedAmount,
    };
    showLoader(true);
    console.log("Sending repayment link request...", customer);
    sendRepaymentLinkApi(customer)
      .then((response) => {
        console.log("Repayment link response:", response);
        
        // Check if the API request failed (status code not 200 or 201)
        if (response?.statusCode && ![200, 201].includes(+response.statusCode)) {
          console.error("Payment link generation failed:", response);
          hideLoader();
          
          // Show error message from API response
          const errorMessage = response?.statusMessage || response?.payload?.message || "Failed to generate payment link";
          enqueueSnackbar(errorMessage, {
            variant: "error",
            autoHideDuration: 4000,
          });
          return; // Exit early without sending message
        }

        const paymentLink = response?.data?.paymentLink;
        console.log("Payment link received:", paymentLink);
        
        // Check if payment link is actually present
        if (!paymentLink) {
          console.error("No payment link in response");
          hideLoader();
          enqueueSnackbar("Failed to generate payment link - no link received", {
            variant: "error",
            autoHideDuration: 3000,
          });
          return; // Exit early without sending message
        }
        
        setRepaymentLink(paymentLink); // Store the full link

        // Create masked link for agent view
        const maskedLink = maskPaymentLink(paymentLink);
        console.log("Masked link:", maskedLink);

        // Store the mapping for later replacement
        const newMapping = { [maskedLink]: paymentLink };
        setLinkMapping((prev) => ({ ...prev, ...newMapping }));

        // Format the message with customer name, amount, and MASKED link for agent
        const customerName = customerDetails?.name || "Customer";
        const formattedMessage = `Dear ${customerName}, your Fibe loan is overdue by Rs.${selectedAmount}. Please complete the payment immediately via this link: ${maskedLink}.`;
        console.log("Formatted message:", formattedMessage);

        // Send the formatted message to the chat input with the mapping
        if (onPaymentMessageGenerated) {
          console.log("Calling onPaymentMessageGenerated callback");
          onPaymentMessageGenerated(formattedMessage, newMapping);
        } else {
          console.log("onPaymentMessageGenerated callback not available");
        }

        hideLoader();

        // Show masked link in success message for agent's reference
        enqueueSnackbar(`Payment message generated with link: ${maskedLink}`, {
          variant: "success",
          autoHideDuration: 4000,
        });

        // Close the user details panel after generating the message
        onClose();
      })
      .catch((error) => {
        console.error("Error generating payment link:", error);
        hideLoader();
        enqueueSnackbar("Failed to generate payment link", {
          variant: "error",
          autoHideDuration: 3000,
        });
      });
  }, [
    selectedAmount,
    customerDetails?.name,
    onPaymentMessageGenerated,
    onClose,
    maskPaymentLink,
    user?.customerId,
  ]);

  useEffect(() => {
    if (chatSlice?.activeChatId) {
      const customerId = chatSlice?.chatUser?.customerId;
      console.warn("Fetching details for customer ID:", customerId, chatSlice);
      getCustomerDetails(customerId);
      // Removed automatic synopsis call - now only called when user clicks synopsis section
    }
  }, [chatSlice?.activeChatId]);

  const sendEventToParent = () => {
    document
      .getElementById("chat-customer-id")
      .addEventListener("click", () => {
        const eventData = {
          type: "VIEW_CUSTOMER_IN_ACCOUNTS",
          payload: {
            customerId: user?.customerId,
          },
        };

        // Send message to parent
        window.parent.postMessage(eventData, "*");
        // Replace '*' with exact parent domain for security
      });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(repaymentLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500); // reset after 1.5s
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };
  useEffect(() => {
    function handleClickOutside(event) {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        onClose(); // close drawer
      }
    }

    if (visible) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [visible, onClose]);

  if (!visible) return null;
  return (
    <div
      ref={drawerRef}
      className={`fixed top-0 right-0 h-full w-80 shadow-lg transition-transform duration-300 ease-in-out z-50
        ${visible ? "translate-x-0" : "translate-x-full"}`}
      style={{ backgroundColor: "var(--wa-panel-background)" }}
    >
      {/* Header (Fixed) */}
      <div
        className="flex justify-between items-center px-4 py-4 border-b"
        style={{
          backgroundColor: "var(--wa-green)",
          borderColor: "var(--wa-border)",
        }}
      >
        <h3 className="font-medium text-lg" style={{ color: "white" }}>
          Contact info
        </h3>
        <button
          onClick={onClose}
          className="cursor-pointer hover:opacity-80 text-white"
        >
          ✕
        </button>
      </div>
      <div
        className="p-4 text-sm space-y-4 overflow-y-auto h-[calc(100vh-60px)] wa-scrollbar"
        style={{
          color: "var(--wa-text-primary)",
          backgroundColor: "var(--wa-panel-background)",
        }}
      >
        {/* Top Details (Fixed) */}
        <div className="text-center flex flex-col gap-3">
          <div className="flex justify-center items-center">
            {customerDetails?.profilePicture && imgError ? (
              <img
                src={customerDetails.profilePicture}
                alt="chat-img"
                onError={() => setImgError(true)}
                onClick={() =>
                  openMediaPopup(
                    "IMAGE",
                    customerDetails.profilePicture,
                    "User Avatar"
                  )
                }
                className="h-20 w-20 object-cover rounded-full cursor-pointer transition-transform duration-200 ease-in-out hover:scale-[1.05]"
              />
            ) : (
              <div
                className="h-20 w-20 rounded-full flex items-center justify-center text-white font-semibold text-2xl cursor-pointer transition-transform duration-200 ease-in-out hover:scale-[1.05]"
                style={{
                  backgroundColor: customerDetails?.name
                    ? `hsl(${
                        (customerDetails.name.charCodeAt(0) * 137.5) % 360
                      }, 50%, 50%)`
                    : "var(--wa-hover)",
                }}
              >
                {customerDetails?.name
                  ? customerDetails.name
                      .split(" ")
                      .map((word) => word.charAt(0))
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()
                  : "U"}
              </div>
            )}
          </div>

          <div
            className="font-medium text-xl"
            style={{ color: "var(--wa-text-primary)" }}
          >
            {titleCaseString(customerDetails?.name) || "NA"}
          </div>

          <div
            className="text-sm"
            style={{ color: "var(--wa-text-secondary)" }}
          >
            <p>Campaign: {customerDetails?.campaignName}</p>
          </div>

          <div
            className="text-sm"
            style={{ color: "var(--wa-text-secondary)" }}
          >
            Customer ID:
            <a
              id="chat-customer-id"
              className="cursor-pointer ml-1"
              onClick={sendEventToParent}
              style={{
                color: "var(--wa-green)",
                textDecoration: "underline",
              }}
            >
              {customerDetails?.customerId || ""}
            </a>
          </div>

          <div
            className="text-sm"
            style={{ color: "var(--wa-text-secondary)" }}
          >
            DPD:{" "}
            <strong style={{ color: "var(--wa-text-primary)" }}>
              {customerDetails?.dpd || 0}
            </strong>
          </div>
        </div>
        {/* <hr /> */}

        {/* Customer Synopsis - Minimal Tab Style */}
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white hidden">
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
            onClick={() => {
              setSynopsisExpanded(!synopsisExpanded);
              // Only call API when expanding and no data exists
              if (!synopsisExpanded && !synopsisData && !synopsisLoading) {
                getSynopsisDetails(user?.customerId);
              }
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">�</span>
              <span className="text-sm font-medium text-gray-700">
                Synopsis
              </span>
              {synopsisData && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Ready
                </span>
              )}
            </div>
            <span
              className={`text-xs text-gray-500 transition-transform duration-200 ${
                synopsisExpanded ? "rotate-180" : ""
              }`}
            >
              ▼
            </span>
          </div>

          {synopsisExpanded && (
            <div className="px-4 py-3 space-y-3 bg-gray-50/30">
              {synopsisLoading ? (
                <div className="flex items-center gap-2 py-4">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-600">Analyzing...</span>
                </div>
              ) : synopsisData ? (
                <>
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Customer Summary
                    </div>
                    <div className="text-sm text-gray-800 bg-white p-3 rounded border">
                      {synopsisData.synopsis ||
                        "No synopsis available for this customer."}
                    </div>
                  </div>

                  {synopsisData.recommendations && (
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                        Action Items
                      </div>
                      <div className="text-sm text-gray-800 bg-yellow-50 p-3 rounded border border-yellow-200">
                        {synopsisData.recommendations}
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={() => getSynopsisDetails(user?.customerId)}
                      className="text-xs px-3 py-1.5 bg-gray-700 text-white rounded hover:bg-gray-800 transition-colors duration-150"
                    >
                      Refresh
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="text-2xl mb-2">📄</div>
                  <p className="text-xs text-gray-500 mb-3">
                    No synopsis available
                  </p>
                  <button
                    onClick={() => getSynopsisDetails(user?.customerId)}
                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-150"
                  >
                    Generate
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <hr />

        {/* Last Repayment */}
        <div className="text-center flex flex-col gap-2">
          <p>Last Repayment:</p>
          <p className="font-semibold">
            {customerDetails?.lastPaymentDate
              ? convertISOToDateString(customerDetails?.lastPaymentDate) +
                "(" +
                formatIndianCurrency(customerDetails?.lastPaymentAmount || 0) +
                ")"
              : "NA"}
          </p>
        </div>
        <hr />

        {/* Active Loans */}
        <div>
          <div className="text-[#434343] font-medium mb-2">Active loans</div>
          <div className="border border-[#DDDDDD] rounded p-3 bg-[#F7F9FF] space-y-1">
            <div>
              Product: <strong>{customerDetails?.product || "NA"}</strong>
            </div>
            <div>
              POS:{" "}
              {formatIndianCurrency(customerDetails?.principleOutstanding || 0)}
            </div>
            <div>
              O/s:{" "}
              {formatIndianCurrency(customerDetails?.totalOutstanding || 0)}
            </div>
            <div>
              EMI: {formatIndianCurrency(customerDetails?.emiAmount || 0)}
            </div>
            <div className="text-red-600">
              Overdue:{" "}
              {formatIndianCurrency(customerDetails?.overdueAmount || 0)}
            </div>
            <div>
              Charges: {formatIndianCurrency(customerDetails?.totalCharge || 0)}
            </div>
          </div>
        </div>
        <hr />

        {/* Repayment Link */}
        <div className="flex flex-col gap-2">
          <div className="">Repayment link</div>
          <div className="flex gap-2 flex-wrap">
            {linkOptionsNew.map((link, index) => {
              const isActive = activeLink === link.key;
              return (
                <BubbleTab
                  key={link.key}
                  tab={link.label}
                  isActive={isActive}
                  onChange={() => {
                    setActiveLink(link.key);
                    setRepaymentLink("");
                    console.log(customerDetails, customerDetails[link.key]);
                    link.key !== "custom" &&
                      setSelectedAmount(customerDetails[link.key]);
                  }}
                />
              );
            })}
          </div>
          <div
            className={`relative flex flex-row justify-between items-center gap-2 ${
              !activeLink ? "hidden" : ""
            }`}
          >
            {" "}
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
              ₹
            </span>
            <input
              type="number"
              placeholder="Enter Amount"
              className="flex-1 w-full border border-[#ddd] rounded-xl px-3 py-2 pr-2 pl-7 focus:outline-none h-10"
              value={selectedAmount}
              disabled={activeLink !== "custom"}
              step={"0.1"}
              onChange={(e) => {
                setSelectedAmount(e?.target?.value);
              }}
            />{" "}
            <button
              onClick={() => sendRepaymentLink(selectedAmount)}
              className="absolute cursor-pointer w-20 right-0 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black bg-[#dffdd3] border border-[#ddd] h-10 rounded-tr-xl rounded-br-xl text-sm font-medium flex items-center justify-center"
            >
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* Media Popup */}
      <MediaPopup
        isOpen={showMediaPopup}
        onClose={() => setShowMediaPopup(false)}
        mediaData={popupMediaData}
      />
    </div>
  );
};

export default UserDetailPanel;
