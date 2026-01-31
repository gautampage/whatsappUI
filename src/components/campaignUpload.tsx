"use client";
import { enqueueSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { getCampaignListApi, uploadCampaignApi } from "../middleware/chat.service";
import { useLoader } from "../middleware/loader.context";
import SessionManager from "../middleware/sessionManager";

interface Campaign {
  campaignId: number;
  campaignName: string;
  templateMessage: string;
}

interface CampaignHistory {
  campaignName: string;
  runDate: string;
  runBy: string;
  status: string;
}

export default function CampaignUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignHistory, setCampaignHistory] = useState<CampaignHistory[]>([]);
  const [isEligible, setIsEligible] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);
  const { showLoader, hideLoader } = useLoader();

  useEffect(() => {
    fetchCampaignList();
  }, []);

  const fetchCampaignList = async () => {
    try {
      const agentId = SessionManager.getAgentId();
      const requestPayload = {
        team: "collection",
        requestFor: "CAMPAIGN_LIST",
        agentId: agentId,
      };

      const response = await getCampaignListApi(requestPayload);

      if (response?.statusCode && [200, 201].includes(+response.statusCode)) {
        // Extract campaign objects with campaignId, campaignName, and templateMessage
        const campaignList = Array.isArray(response.payload?.campaignList)
          ? response.payload.campaignList.map((item: any) => ({
              campaignId: item.campaignId,
              campaignName: item.campaignName,
              templateMessage: item.templateMessage,
            }))
          : [];
        
        // Extract campaign history
        const historyList = Array.isArray(response.payload?.campaignHistoryList)
          ? response.payload.campaignHistoryList.map((item: any) => ({
              campaignName: item.campaignName,
              runDate: item.runDate,
              runBy: item.runBy,
              status: item.status,
            }))
          : [];
        
        setCampaigns(campaignList);
        setCampaignHistory(historyList);
        setIsEligible(response.payload?.isEligible ?? false);
        
        // Reset warning dismissed state when eligibility changes
        if (response.payload?.isEligible) {
          setIsWarningDismissed(false);
        }
      } else {
        enqueueSnackbar(
          response?.statusMessage || "Failed to fetch campaign list",
          { variant: "error" }
        );
      }
    } catch (error) {
      console.error("Error fetching campaign list:", error);
      enqueueSnackbar("Error fetching campaign list", { variant: "error" });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file type (CSV, Excel)
      const allowedTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
        enqueueSnackbar(`File selected: ${file.name}`, {
          variant: "success",
        });
      } else {
        enqueueSnackbar("Please upload a CSV or Excel file", {
          variant: "error",
        });
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      enqueueSnackbar("Please select a file to upload", { variant: "error" });
      return;
    }

    if (!selectedCampaignId) {
      enqueueSnackbar("Please select a campaign name", { variant: "error" });
      return;
    }

    const selectedCampaign = campaigns.find(
      (c) => c.campaignId.toString() === selectedCampaignId
    );

    showLoader();

    try {
      // Convert file to base64
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onload = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
      });

      // Get agentId from session
      const agentId = SessionManager.getAgentId();

      // Create JSON payload with file as base64
      const payload = {
        requestFor: "RUN_CAMPAIGN",
        campaignId: parseInt(selectedCampaignId),
        fileName: selectedFile.name,
        file: fileBase64,
        agentId: agentId,
      };

      const response = await uploadCampaignApi(payload);

      hideLoader();

      if (response?.statusCode && [200, 201].includes(+response.statusCode)) {
        enqueueSnackbar(
          `Campaign "${selectedCampaign?.campaignName}" uploaded successfully with ${selectedFile.name}`,
          { variant: "success", autoHideDuration: 4000 }
        );

        // Reset form
        setSelectedFile(null);
        setSelectedCampaignId("");
        
        // Reload campaign data to get updated history
        fetchCampaignList();
      } else {
        enqueueSnackbar(
          response?.statusMessage || "Failed to upload campaign",
          { variant: "error" }
        );
      }
    } catch (error) {
      hideLoader();
      console.error("Error uploading campaign:", error);
      enqueueSnackbar("Error uploading campaign", { variant: "error" });
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    enqueueSnackbar("File removed", { variant: "info" });
  };

  // Get selected campaign details
  const selectedCampaign = campaigns.find(
    (c) => c.campaignId.toString() === selectedCampaignId
  );

  return (
    <div className="h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Campaign Manager
        </h1>
      </div>

      {/* Error Message for ineligible campaigns */}
      {!isEligible && !isWarningDismissed && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Campaign upload is currently disabled
              </h3>
              <p className="text-sm text-red-700 mt-1">
                A previous campaign is still in process. Please wait until it completes before uploading a new campaign.
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setIsWarningDismissed(true)}
                  className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50 transition-colors"
                  title="Dismiss"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign History Table */}
      {campaignHistory.length > 0 && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border">
          <div 
            className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Campaign History</h2>
              <span className="ml-2 text-sm text-gray-500">({campaignHistory.length})</span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                isHistoryExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
          {isHistoryExpanded && (
            <div className="px-6 pb-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Campaign Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Run Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Run By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {campaignHistory.map((history, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {history.campaignName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(history.runDate).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {history.runBy}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              history.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : history.status === "COMPLETED"
                                ? "bg-green-100 text-green-800"
                                : history.status === "FAILED"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {history.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100%-80px)]">
        {/* Left Column - Form */}
        <div
          className="rounded-lg shadow-sm border p-6 flex flex-col"
          style={{ backgroundColor: "white", borderColor: "#e5e7eb" }}
        >
          <div className="flex items-center gap-3 mb-6">
            <svg
              className="w-7 h-7 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900">Upload Campaign</h2>
          </div>

          {/* Campaign Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Campaign
            </label>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              disabled={!isEligible}
              className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                !isEligible ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
            >
              <option value="">Choose a campaign</option>
              {campaigns.map((campaign) => (
                <option key={campaign.campaignId} value={campaign.campaignId}>
                  {campaign.campaignName}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload Section */}
          <div className="flex-1 flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload File
            </label>
            {!selectedFile ? (
              <div className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center flex flex-col items-center justify-center">
                <input
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  disabled={!selectedCampaignId || !isEligible}
                />
                <svg
                  className="w-12 h-12 text-gray-400 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-sm text-gray-700 font-medium mb-1">
                  Drag and drop your file here
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  or click the button below
                </p>
                <label
                  htmlFor="file-upload"
                  className={`px-5 py-2 rounded-lg font-medium transition-colors text-sm ${
                    selectedCampaignId && isEligible
                      ? "cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
                      : "cursor-not-allowed bg-gray-300 text-gray-500"
                  }`}
                >
                  Choose File
                </label>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="border border-gray-300 rounded-lg p-4 bg-blue-50 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-auto">
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setSelectedCampaignId("");
                    }}
                    className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!isEligible}
                    className={`px-5 py-2 rounded-lg font-medium transition-colors shadow-md text-sm ${
                      isEligible
                        ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                    title={!isEligible ? "Campaign upload is disabled. A previous campaign is in process." : "Upload campaign"}
                  >
                    Upload Campaign
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Mobile Preview */}
        <div
          className="rounded-lg shadow-sm border p-6 flex flex-col items-center justify-center"
          style={{ backgroundColor: "#f9fafb", borderColor: "#e5e7eb" }}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-8">Live Mobile Preview</h2>

          {selectedCampaign ? (
            <div className="relative" style={{ perspective: "1000px" }}>
              {/* Mobile Phone Frame with realistic shadow */}
              <div
                className="relative overflow-hidden"
                style={{
                  width: "340px",
                  height: "680px",
                  backgroundColor: "#000",
                  borderRadius: "50px",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
                  border: "8px solid #1a1a1a",
                }}
              >
                {/* Screen bezel effect */}
                <div
                  className="absolute inset-0 rounded-[42px] pointer-events-none z-50"
                  style={{
                    boxShadow: "inset 0 0 6px rgba(0, 0, 0, 0.3)",
                  }}
                />

                {/* Status Bar */}
                <div
                  className="relative z-30 px-6 pt-2 flex items-center justify-between text-white text-xs"
                  style={{ backgroundColor: "#075E54" }}
                >
                  <span className="font-medium">9:41</span>
                  <div className="flex items-center gap-1">
                    {/* Signal Icon */}
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2 22h5v-5H2v5zm6-7h5v12h-5V15zm6-7h5v19h-5V8zm6-8h5v27h-5V0z" />
                    </svg>
                    {/* WiFi Icon */}
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
                    </svg>
                    {/* Battery Icon */}
                    <svg className="w-6 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="2" y="6" width="18" height="12" rx="2" ry="2" fill="currentColor" />
                      <rect x="21" y="9" width="2" height="6" rx="1" ry="1" fill="currentColor" />
                    </svg>
                  </div>
                </div>

                {/* WhatsApp Header */}
                <div
                  className="relative z-20 px-4 pb-3 flex items-center gap-3"
                  style={{ backgroundColor: "#075E54" }}
                >
                  <button className="text-white">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
                    style={{
                      backgroundColor: "#128C7E",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                    }}
                  >
                    <span className="text-white font-bold text-base">F</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-base">Fibe</p>
                    <p className="text-teal-100 text-xs">Official Business Account</p>
                  </div>
                  <div className="flex gap-3">
                    <button className="text-white">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </button>
                    <button className="text-white">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Chat Background */}
                <div
                  className="overflow-y-auto p-4"
                  style={{
                    height: "calc(100% - 140px)",
                    backgroundColor: "#e5ddd5",
                    backgroundImage:
                      "url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gMTAwIDAgTCAwIDAgMCAxMDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2Q5ZDljZSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=)",
                  }}
                >
                  {/* Message Bubble */}
                  <div className="flex items-start gap-2 mb-4">
                    <div className="flex-1">
                      <div
                        className="rounded-lg rounded-tl-none p-3 max-w-[85%]"
                        style={{ 
                          backgroundColor: "white",
                          boxShadow: "0 1px 0.5px rgba(0, 0, 0, 0.13)",
                        }}
                      >
                        <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
                          {selectedCampaign.templateMessage}
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[11px] text-gray-500">
                            {new Date().toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-2 flex flex-col gap-2 max-w-[85%]">
                        <button
                          className="rounded-md px-4 py-3 text-sm font-medium text-center"
                          style={{
                            backgroundColor: "white",
                            color: "#00a5f4",
                            boxShadow: "0 1px 0.5px rgba(0, 0, 0, 0.13)",
                          }}
                        >
                          📱 Visit Website
                        </button>
                        <button
                          className="rounded-md px-4 py-3 text-sm font-medium text-center"
                          style={{
                            backgroundColor: "white",
                            color: "#00a5f4",
                            boxShadow: "0 1px 0.5px rgba(0, 0, 0, 0.13)",
                          }}
                        >
                          💬 Contact Support
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Bar */}
                <div
                  className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center gap-2"
                  style={{ 
                    backgroundColor: "#f0f2f5",
                    borderTop: "1px solid #e9edef",
                  }}
                >
                  <button className="text-gray-600 p-1.5">
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm-3.204 1.362c-.026-.307-.068 5.218 6.063 5.551 6.066-.25 6.066-5.551 6.066-5.551-6.078 1.416-12.129 0-12.129 0zm11.363 1.108s-.669 1.959-5.051 1.959c-3.505 0-5.388-1.164-5.607-1.959 0 0 5.912 1.055 10.658 0zM11.804 1.011C5.609 1.011.978 6.033.978 12.228s4.826 10.761 11.021 10.761S23.02 18.423 23.02 12.228c.001-6.195-5.021-11.217-11.216-11.217zM12 21.354c-5.273 0-9.381-3.886-9.381-9.159s3.942-9.548 9.215-9.548 9.548 4.275 9.548 9.548c-.001 5.272-4.109 9.159-9.382 9.159zm3.108-9.751c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962z" />
                    </svg>
                  </button>
                  <button className="text-gray-600 p-1.5">
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                      <path d="M13 7h-2v5.41l3.36 3.36 1.41-1.41L13 11.59z" />
                    </svg>
                  </button>
                  <div 
                    className="flex-1 rounded-full px-4 py-2.5"
                    style={{ 
                      backgroundColor: "white",
                      border: "1px solid #e9edef",
                    }}
                  >
                    <p className="text-sm text-gray-500">Message</p>
                  </div>
                  <button className="text-gray-600 p-1.5">
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.35 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2z" />
                    </svg>
                  </button>
                </div>

                {/* Phone Home Indicator */}
                <div 
                  className="absolute bottom-1 left-1/2 transform -translate-x-1/2 rounded-full"
                  style={{
                    width: "120px",
                    height: "4px",
                    backgroundColor: "rgba(255, 255, 255, 0.3)",
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[680px]">
              <div className="text-center">
                <div 
                  className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  }}
                >
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium text-base mb-1">
                  Select a campaign
                </p>
                <p className="text-gray-400 text-sm">
                  Choose a campaign to see the live preview
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
