"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ActiveAgentsList from "../../components/activeAgentsList";
import CampaignUpload from "../../components/campaignUpload";

export default function SupervisorPage() {
  const [activeTab, setActiveTab] = useState("agents");
  const router = useRouter();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f5f5f5" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-6 py-4 border-b"
        style={{
          backgroundColor: "white",
          borderColor: "#e0e0e0",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/chat?token=sample_token_123&agentId=12&roleId=13")}
              className="text-gray-600 hover:text-gray-800 transition-colors"
              title="Back to Agent Portal"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
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
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {activeTab === "agents" ? <ActiveAgentsList /> : <CampaignUpload />}
      </div>
    </div>
  );
}
