"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import ActiveAgentsList from "../../components/activeAgentsList";
import CampaignUpload from "../../components/campaignUpload";
import ProtectedRoute from "../../components/protectedRoute";
import Sidebar from "../../components/sidebar";
import TabNavigation from "../../components/tabNavigation";
import { registerLoaderCallbacks } from "../../middleware/axios";
import { getAccessDetailsApi } from "../../middleware/chat.service";
import { useLoader } from "../../middleware/loader.context";
import { setAccessPermissions } from "../../store/slices/chatSlice";

export default function ChatLayout({ children }) {
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { showLoader, hideLoader } = useLoader();
  const [activeTab, setActiveTab] = useState("chat");
  const [accessPermissions, setAccessPermissionsState] = useState({
    hasSupervisorAccess: false,
    hasTeamAccess: false,
    hasProfileAccess: false,
    hasPaymentLinkAccess: false,
    hasCampaignUploadAccess: false,
    hasActiveAgentAccess: false,
  });

  // Register loader callbacks for axios interceptors
  useEffect(() => {
    registerLoaderCallbacks(showLoader, hideLoader);
  }, [showLoader, hideLoader]);

  // Extract parameters from URL
  const token = searchParams.get("token");
  const agentId = searchParams.get("agentId");
  const roleId = searchParams.get("roleId");

  useEffect(() => {
    // Log the extracted parameters for debugging
    console.log("🔗 URL Parameters:", { token, agentId, roleId });

    // Validate required parameters
    if (!token || !agentId || !roleId) {
      console.error("❌ Missing required URL parameters:", {
        token: !!token,
        agentId: !!agentId,
        roleId: !!roleId,
      });
    } else {
      console.log("✅ All required parameters present");
      // Fetch access details
      fetchAccessDetails();
    }
  }, [token, agentId, roleId]);

  const fetchAccessDetails = async () => {
    try {
      const response = await getAccessDetailsApi({ agentId });
      if (response?.statusCode && [200, 201].includes(+response.statusCode)) {
        setAccessPermissionsState(response.payload);
        dispatch(setAccessPermissions(response.payload));
        console.log("✅ Access permissions loaded:", response.payload);
      }
    } catch (error) {
      console.error("Error fetching access details:", error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen">
        {/* Tab Navigation */}
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          accessPermissions={accessPermissions}
        />

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Chat Tab Content */}
          {activeTab === "chat" && (
            <>
              <Sidebar 
                agentData={{ token, agentId, roleId }} 
                accessPermissions={accessPermissions}
              />
              <div className="flex flex-col flex-1">
                <main className="flex-1 overflow-y-auto">{children}</main>
              </div>
            </>
          )}

          {/* Agents Tab Content */}
          {activeTab === "agents" && (
            <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: "#f5f5f5" }}>
              {accessPermissions?.hasActiveAgentAccess ? (
                <ActiveAgentsList />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <svg
                      className="w-16 h-16 text-gray-400 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Access Restricted</h3>
                    <p className="text-gray-500">
                      You don&apos;t have permission to access Active Agents
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Campaign Tab Content */}
          {activeTab === "campaign" && (
            <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: "#f5f5f5" }}>
              {accessPermissions?.hasCampaignUploadAccess ? (
                <CampaignUpload />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <svg
                      className="w-16 h-16 text-gray-400 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Access Restricted</h3>
                    <p className="text-gray-500">
                      You don&apos;t have permission to access Campaign Upload
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
