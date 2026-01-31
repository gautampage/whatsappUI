"use client";
import { enqueueSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { getActiveAgentsListApi } from "../middleware/chat.service";
import { useLoader } from "../middleware/loader.context";

type AgentStatus = "online" | "offline" | "all";

export default function ActiveAgentsList() {
  const [onlineAgents, setOnlineAgents] = useState([]);
  const [offlineAgents, setOfflineAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [selectedVertical, setSelectedVertical] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<AgentStatus>("online");
  const [availableVerticals, setAvailableVerticals] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [counts, setCounts] = useState({
    totalCount: 0,
    activeCount: 0,
    inactiveCount: 0,
  });
  const { showLoader, hideLoader } = useLoader();

  useEffect(() => {
    fetchActiveAgents();
  }, []);

  useEffect(() => {
    // Get the appropriate agent list based on status filter
    let agentsToFilter = [];
    if (selectedStatus === "online") {
      agentsToFilter = onlineAgents;
    } else if (selectedStatus === "offline") {
      agentsToFilter = offlineAgents;
    } else {
      agentsToFilter = [...onlineAgents, ...offlineAgents];
    }

    // Filter by vertical
    if (selectedVertical === "all") {
      setFilteredAgents(agentsToFilter);
    } else {
      setFilteredAgents(
        agentsToFilter.filter((agent: any) => agent.vertical === selectedVertical)
      );
    }
    
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [selectedVertical, selectedStatus, onlineAgents, offlineAgents]);

  const fetchActiveAgents = async () => {
    showLoader();
    try {
      const requestPayload = {
        team: "collection",
      };

      const response = await getActiveAgentsListApi(requestPayload);

      if (response?.statusCode && [200, 201].includes(+response.statusCode)) {
        // Transform online agents
        const onlineAgentDetails = response.payload?.onlineAgentDetails || [];
        const transformedOnlineAgents = onlineAgentDetails.map(
          (agent: any, index: number) => ({
            id: `online-${index}`,
            name: agent.name || "Unknown Agent",
            status: agent.status || "Online",
            team: agent.team || "COLLECTION",
            vertical: agent.vertical || "N/A",
            initials: getInitials(agent.name || "NA"),
          })
        );

        // Transform offline agents
        const offlineAgentDetails = response.payload?.offlineAgentDetails || [];
        const transformedOfflineAgents = offlineAgentDetails.map(
          (agent: any, index: number) => ({
            id: `offline-${index}`,
            name: agent.name || "Unknown Agent",
            status: agent.status || "Offline",
            team: agent.team || "COLLECTION",
            vertical: agent.vertical || "N/A",
            initials: getInitials(agent.name || "NA"),
          })
        );

        setOnlineAgents(transformedOnlineAgents);
        setOfflineAgents(transformedOfflineAgents);
        setFilteredAgents(transformedOnlineAgents); // Show online by default

        // Extract unique verticals from all agents
        const allAgents = [...transformedOnlineAgents, ...transformedOfflineAgents];
        const verticals = Array.from(
          new Set(allAgents.map((agent: any) => agent.vertical))
        );
        setAvailableVerticals(verticals.filter((v) => v !== "N/A").sort());

        // Set counts from API response
        setCounts({
          totalCount: response.payload?.totalCount || 0,
          activeCount: response.payload?.activeCount || 0,
          inactiveCount: response.payload?.inactiveCount || 0,
        });
      } else {
        enqueueSnackbar(
          response?.statusMessage || "Failed to fetch active agents",
          { variant: "error" }
        );
      }
    } catch (error) {
      console.error("Error fetching active agents:", error);
      enqueueSnackbar("Error fetching active agents", { variant: "error" });
    } finally {
      hideLoader();
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "NA";
    const words = name.trim().split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "online":
        return "#4ade80"; // green
      case "break":
        return "#fbbf24"; // yellow
      case "offline":
        return "#9ca3af"; // gray
      default:
        return "#9ca3af";
    }
  };

  const getAvatarColor = (index: number) => {
    const colors = [
      "#3b82f6", // blue
      "#8b5cf6", // purple
      "#ec4899", // pink
      "#f59e0b", // amber
      "#10b981", // emerald
    ];
    return colors[index % colors.length];
  };

  const getTeamBadgeColor = (team: string) => {
    return "#dbeafe"; // light blue
  };

  const getTeamTextColor = (team: string) => {
    return "#1e40af"; // dark blue
  };

  const getVerticalBadgeColor = (vertical: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      "PRE-X": { bg: "#dbeafe", text: "#1e40af" }, // blue
      "X-BUCKET": { bg: "#fef3c7", text: "#92400e" }, // amber
      "30+ BUCKET": { bg: "#fce7f3", text: "#9f1239" }, // pink
      "N/A": { bg: "#f3f4f6", text: "#6b7280" }, // gray
    };
    return colors[vertical] || { bg: "#e0e7ff", text: "#4338ca" }; // default indigo
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredAgents.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedAgents = filteredAgents.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className="rounded-lg shadow-sm border"
      style={{ backgroundColor: "white", borderColor: "#e5e7eb" }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Active Agents</h2>
          
          {/* Vertical Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="vertical-filter" className="text-sm font-medium text-gray-600">
              Filter by Vertical:
            </label>
            <select
              id="vertical-filter"
              value={selectedVertical}
              onChange={(e) => setSelectedVertical(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              style={{ borderColor: "#d1d5db" }}
            >
              <option value="all">All Verticals</option>
              {availableVerticals.map((vertical) => (
                <option key={vertical} value={vertical}>
                  {vertical}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-3 gap-4">
          {/* Total Agents */}
          <div
            onClick={() => setSelectedStatus("all")}
            className="rounded-lg p-4 border-2 cursor-pointer transition-all hover:shadow-xl hover:scale-105 transform"
            style={{ 
              backgroundColor: selectedStatus === "all" ? "#e0e7ff" : "#f9fafb", 
              borderColor: selectedStatus === "all" ? "#6366f1" : "#e5e7eb",
              borderWidth: selectedStatus === "all" ? "3px" : "2px"
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                  Total Agents
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {counts.totalCount}
                </p>
              </div>
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-md"
                style={{ backgroundColor: "#e0e7ff" }}
              >
                <svg
                  className="w-7 h-7"
                  style={{ color: "#4f46e5" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Online */}
          <div
            onClick={() => setSelectedStatus("online")}
            className="rounded-lg p-4 border-2 cursor-pointer transition-all hover:shadow-xl hover:scale-105 transform"
            style={{ 
              backgroundColor: selectedStatus === "online" ? "#dcfce7" : "#f0fdf4", 
              borderColor: selectedStatus === "online" ? "#16a34a" : "#bbf7d0",
              borderWidth: selectedStatus === "online" ? "3px" : "2px"
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-green-700 mb-1 uppercase tracking-wide">
                  Online Agents
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {counts.activeCount}
                </p>
              </div>
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-md"
                style={{ backgroundColor: "#86efac" }}
              >
                <svg
                  className="w-7 h-7 text-green-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Offline */}
          <div
            onClick={() => setSelectedStatus("offline")}
            className="rounded-lg p-4 border-2 cursor-pointer transition-all hover:shadow-xl hover:scale-105 transform"
            style={{ 
              backgroundColor: selectedStatus === "offline" ? "#e5e7eb" : "#fafafa", 
              borderColor: selectedStatus === "offline" ? "#4b5563" : "#e5e7eb",
              borderWidth: selectedStatus === "offline" ? "3px" : "2px"
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  Offline Agents
                </p>
                <p className="text-3xl font-bold text-gray-500">
                  {counts.inactiveCount}
                </p>
              </div>
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-md"
                style={{ backgroundColor: "#e5e7eb" }}
              >
                <svg
                  className="w-7 h-7 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr
              className="border-b"
              style={{ backgroundColor: "#f9fafb", borderColor: "#e5e7eb" }}
            >
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">
                Agent Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">
                Team
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">
                Vertical
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedAgents.length > 0 ? (
              paginatedAgents.map((agent, index) => (
                <tr
                  key={agent.id}
                  className="border-b hover:bg-gray-50 transition-colors"
                  style={{ borderColor: "#e5e7eb" }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                        style={{ backgroundColor: getAvatarColor(startIndex + index) }}
                      >
                        {agent.initials}
                      </div>
                      <span className="text-sm font-medium text-gray-800">
                        {agent.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getStatusColor(agent.status) }}
                      />
                      <span className="text-sm text-gray-700">
                        {agent.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: getTeamBadgeColor(agent.team),
                        color: getTeamTextColor(agent.team),
                      }}
                    >
                      {agent.team}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: getVerticalBadgeColor(agent.vertical).bg,
                        color: getVerticalBadgeColor(agent.vertical).text,
                      }}
                    >
                      {agent.vertical}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No agents found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredAgents.length)} of {filteredAgents.length} agents
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg border text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                style={{ borderColor: "#d1d5db" }}
              >
                Previous
              </button>
              
              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-gray-500">...</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goToPage(page as number)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "border hover:bg-gray-50 text-gray-700"
                    }`}
                    style={currentPage !== page ? { borderColor: "#d1d5db" } : {}}
                  >
                    {page}
                  </button>
                )
              ))}
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg border text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                style={{ borderColor: "#d1d5db" }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
