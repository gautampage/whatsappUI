"use client";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  accessPermissions: {
    hasSupervisorAccess?: boolean;
    hasTeamAccess?: boolean;
    hasProfileAccess?: boolean;
    hasPaymentLinkAccess?: boolean;
    hasCampaignUploadAccess?: boolean;
    hasActiveAgentAccess?: boolean;
  };
}

export default function TabNavigation({
  activeTab,
  onTabChange,
  accessPermissions,
}: TabNavigationProps) {
  const tabs = [
    {
      id: "chat",
      label: "Chat",
      icon: (
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
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
      visible: true, // Chat is always visible
    },
    {
      id: "agents",
      label: "Agents",
      icon: (
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
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      visible: accessPermissions?.hasActiveAgentAccess || false,
    },
    {
      id: "campaign",
      label: "Campaign",
      icon: (
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
            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
          />
        </svg>
      ),
      visible: accessPermissions?.hasCampaignUploadAccess || false,
    },
  ];

  const visibleTabs = tabs.filter((tab) => tab.visible);

  return (
    <div
      className="flex items-center border-b bg-white shadow-sm"
      style={{ 
        borderColor: "#e0e0e0",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif"
      }}
    >
      <div className="flex items-center px-6 py-3">
        <div className="flex items-center gap-2 mr-6">
          <svg
            className="w-8 h-8 text-green-600"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          <div>
            <h1 className="text-xl font-bold text-gray-900" style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
              Fibe Whatsapp Portal
            </h1>
            <p className="text-xs text-gray-500" style={{ fontWeight: 400 }}>
              Customer Service Portal
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center gap-1 px-4">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 transition-all relative ${
              activeTab === tab.id
                ? "text-green-600"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
            style={{ 
              fontWeight: activeTab === tab.id ? 600 : 500,
              fontSize: "15px"
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"
                style={{ borderRadius: "2px 2px 0 0" }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
