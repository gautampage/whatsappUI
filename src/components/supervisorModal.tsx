"use client";
import { useState } from "react";
import ActiveAgentsList from "./activeAgentsList";
import CampaignUpload from "./campaignUpload";

interface SupervisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessPermissions?: {
    hasSupervisorAccess?: boolean;
    hasTeamAccess?: boolean;
    hasProfileAccess?: boolean;
    hasPaymentLinkAccess?: boolean;
    hasCampaignUploadAccess?: boolean;
    hasActiveAgentAccess?: boolean;
  };
}

export default function SupervisorModal({
  isOpen,
  onClose,
  accessPermissions,
}: SupervisorModalProps) {
  const [activeTab, setActiveTab] = useState("agents");

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={(e) => {
        // Close modal when clicking on backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="w-full h-full bg-white overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex-shrink-0"
          style={{
            backgroundColor: "white",
            borderColor: "#e0e0e0",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800 transition-colors"
                title="Close Operations Dashboard"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">
                  Operations Dashboard
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Monitor and manage agents and campaigns
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {accessPermissions?.hasActiveAgentAccess && (
                <button
                  onClick={() => setActiveTab("agents")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === "agents"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-300"
                  }`}
                >
                  Active Agents
                </button>
              )}
              {accessPermissions?.hasCampaignUploadAccess && (
                <button
                  onClick={() => setActiveTab("campaigns")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === "campaigns"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-300"
                  }`}
                >
                  Campaign Upload
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div
          className="flex-1 overflow-y-auto p-6"
          style={{ backgroundColor: "#f5f5f5" }}
        >
          {activeTab === "agents" && accessPermissions?.hasActiveAgentAccess && (
            <ActiveAgentsList />
          )}
          {activeTab === "campaigns" && accessPermissions?.hasCampaignUploadAccess && (
            <CampaignUpload />
          )}
        </div>
      </div>
    </div>
  );
}
