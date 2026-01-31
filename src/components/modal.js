"use client";

import { useRef, useState } from "react";
import Portal from "./portalcomponent";

export default function CustomModal({ onClose, children, title }) {
  const modalRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    setDragging(true);
    setStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    const newX = e.clientX - start.x;
    const newY = e.clientY - start.y;
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 bg-black/30 shadow z-50"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div
          ref={modalRef}
          className="bg-white  rounded-lg shadow-lg absolute"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            transformOrigin: "center",
          }}
        >
          {/* Draggable Header */}
          <div
            className="cursor-move p-2 flex justify-between items-center mb-4 border-b border-b-[#dadce0]"
            onMouseDown={handleMouseDown}
          >
            <div className="flex flex-row justify-between items-center w-full gap-2">
              <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
              <button
                onClick={onClose}
                className="text-gray-800 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="flex flex-col p-2">{children}</div>
        </div>
      </div>
    </Portal>
  );
}
