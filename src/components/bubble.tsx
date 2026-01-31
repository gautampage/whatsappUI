"use client";

export default function BubbleTab({ tab, onChange, isActive }) {
  const handleClick = (tab: string) => {
    if (onChange) onChange(tab);
  };

  return (
    <button
      key={tab}
      onClick={() => handleClick(tab)}
      className={`
        flex-1 cursor-pointer px-6 py-3 rounded-full text-base font-semibold transition-all duration-200
        ${
          isActive
            ? "bg-white text-green-600 shadow-sm"
            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
        }
      `}
      style={{
        fontWeight: isActive ? 600 : 500
      }}
    >
      {tab}
    </button>
  );
}
