"use client";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { SearchIcon } from "./svg-components";

// Simple Cross Icon (or replace with your own SVG/React Icon)
const CrossIcon = ({ color = "#0a0a0a", size = 4 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke={color}
    strokeWidth={2}
    className={`w[18px] h-[18px]`}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

export default function SearchBox({
  query,
  onSearch,
  placeHolder,
  sendMessageToParent,
}) {
  const chatSlice = useAppSelector((state: any) => state.chatSlice);
  const [search, setSearch] = useState(chatSlice?.searchString);
  const dispatch = useAppDispatch();

  const handleSubmit = (e) => {
    e?.preventDefault();
    
    // Call the parent's onSearch callback to update local state
    // The parent (sidebar) will handle dispatching to Redux
    onSearch(search);

    // Send search string to parent application
    if (sendMessageToParent && search?.trim()) {
      sendMessageToParent({
        type: "SEARCH_PERFORMED",
        payload: {
          searchString: search.trim(),
          timestamp: new Date().toISOString(),
          searchType: "customer_search",
        },
      });

      console.log("🔍 Sent search query to parent:", search.trim());
    }
  };

  const handleClear = () => {
    setSearch("");
    
    // Call the parent's onSearch callback with empty string
    onSearch("");

    // Send search clear event to parent application
    if (sendMessageToParent) {
      sendMessageToParent({
        type: "SEARCH_CLEARED",
        payload: {
          timestamp: new Date().toISOString(),
          action: "search_cleared",
        },
      });

      console.log("🧹 Sent search clear to parent");
    }
  };

  return (
    <form
      className="flex items-center rounded-lg px-3 py-2 w-full max-w-md transition-colors"
      style={{
        backgroundColor: "var(--wa-hover)",
        border: "1px solid var(--wa-border)",
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ color: "var(--wa-text-secondary)" }}
      >
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
      </svg>
      <input
        type="text"
        value={search}
        onChange={(e) => {
          const value = e?.target?.value;
          // Only allow numeric input
          if (value === "" || /^\d+$/.test(value)) {
            setSearch(value);
          }
        }}
        placeholder={placeHolder || "Search"}
        className="placeholder:font-normal flex-grow outline-none text-sm bg-transparent ml-2 mr-2"
        style={{ color: "var(--wa-text-primary)" }}
      />

      {/* Show clear button only when input has value */}
      {search && (
        <button
          type="button"
          onClick={handleClear}
          className="ml-6 text-gray-500 hover:text-gray-700"
        >
          <CrossIcon color="red" />
        </button>
      )}

      <button
        type="submit"
        className="ml-2 text-teal-600 hover:text-teal-800 cursor-pointer"
        onClick={handleSubmit}
      >
        <SearchIcon color="#0a0a0a" />
      </button>
    </form>
  );
}
