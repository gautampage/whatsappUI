"use client";
// import { DoubleTickIcon } from "./svg-components";

import { useRef, useState } from "react";
import { maskPaymentLinks } from "../middleware/linkMasking";
import MediaPopup from "./mediaPopup";
const DoubleTickIcon = ({ color = "#000000" }) => {
  return (
    <svg
      width="23px"
      height="23px"
      viewBox="0 -0.5 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        verticalAlign: "baseline",
        display: "block",
        marginBottom: "-3px",
      }}
    >
      <path
        d="M5.03033 11.4697C4.73744 11.1768 4.26256 11.1768 3.96967 11.4697C3.67678 11.7626 3.67678 12.2374 3.96967 12.5303L5.03033 11.4697ZM8.5 16L7.96967 16.5303C8.26256 16.8232 8.73744 16.8232 9.03033 16.5303L8.5 16ZM17.0303 8.53033C17.3232 8.23744 17.3232 7.76256 17.0303 7.46967C16.7374 7.17678 16.2626 7.17678 15.9697 7.46967L17.0303 8.53033ZM9.03033 11.4697C8.73744 11.1768 8.26256 11.1768 7.96967 11.4697C7.67678 11.7626 7.67678 12.2374 7.96967 12.5303L9.03033 11.4697ZM12.5 16L11.9697 16.5303C12.2626 16.8232 12.7374 16.8232 13.0303 16.5303L12.5 16ZM21.0303 8.53033C21.3232 8.23744 21.3232 7.76256 21.0303 7.46967C20.7374 7.17678 20.2626 7.17678 19.9697 7.46967L21.0303 8.53033ZM3.96967 12.5303L7.96967 16.5303L9.03033 15.4697L5.03033 11.4697L3.96967 12.5303ZM9.03033 16.5303L17.0303 8.53033L15.9697 7.46967L7.96967 15.4697L9.03033 16.5303ZM7.96967 12.5303L11.9697 16.5303L13.0303 15.4697L9.03033 11.4697L7.96967 12.5303ZM13.0303 16.5303L21.0303 8.53033L19.9697 7.46967L11.9697 15.4697L13.0303 16.5303Z"
        fill={color}
      />
    </svg>
  );
};
const SingleTickIcon = ({ color = "#e2e2e2" }) => {
  return (
    <svg
      width="21px"
      height="21px"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        verticalAlign: "baseline",
        display: "block",
        marginBottom: "-3px",
      }}
    >
      {/* Single WhatsApp-style tick */}
      <path
        fill={color}
        d="M16.694 6.328a.75.75 0 0 1 .123 1.054l-6.9 8.812a.75.75 0 0 1-1.065.12l-3.75-3a.75.75 0 1 1 .944-1.173l3.184 2.546 6.38-8.147a.75.75 0 0 1 1.084-.212z"
      />
    </svg>
  );
};

// export const DoubleTickIcon = ({
//   color = "#000000",
//   size = 25,
//   className = "",
// }) => (
//   <svg
//     viewBox="0 0 24 24"
//     width={size}
//     height={size}
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//     className={className}
//   >
//     <path d="M22 7L12 17l-3-3" color={color} />
//     <path d="M19 7L9 17l-5-5" color={color} />
//   </svg>
// );
export function ChatMessageBubble({
  message, // text or URL
  fileName = "demo.pdf",
  sender = "CUSTOMER", // CUSTOMER | AGENT
  senderId, // senderId to identify auto-generated messages
  contentType = "TEXT", // TEXT | IMAGE | VIDEO | FILE | AUDIO
  messageStatus = "SENT", // SENT | DELIVERED | READ |FAILED
  timestamp,
}) {
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef(null);
  const isUser = sender === "AGENT";
  const [showMediaPopup, setShowMediaPopup] = useState(false);
  const [popupMediaData, setPopupMediaData] = useState(null);
  const [imgError, setImgError] = useState(false);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Mask payment links in messages for display
  // Check if this is an auto-generated system message (AGENT with senderId = 1)
  const isAutoSystem = sender === "AGENT" && senderId === 1;
  
  const maskedMessage = maskPaymentLinks(message);

  const containerClass = `flex w-auto mb-2 ${
    isUser ? "justify-end" : "justify-start"
  }`;

  const bubbleClass = `
    relative box-border px-[7px] py-[6px] rounded-[7.5px] max-w-[75%] text-[14.2px] leading-[19px] font-sans shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] 
    ${
      isUser
        ? "bg-[#dcf8c6] text-[#111b21] rounded-br-none mr-2 ml-auto"
        : !isUser
          ? "bg-[#ffffff] text-[#111b21] rounded-bl-none ml-2 mr-auto"
          : ""
    }
  `;

  const handleDownload = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openMediaPopup = (type, url, name = null, size = null) => {
    setPopupMediaData({
      type,
      url,
      name: name || url.split("/").pop(),
      size,
    });
    setShowMediaPopup(true);
  };

  const handleVideoToggle = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch((error) => {
        console.log("Video autoplay prevented by browser:", error);
        setIsPlaying(false);
      });
    }
    setIsPlaying(!isPlaying);
  };
  const toggleAudioPlay = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch((error) => {
          console.log("Audio autoplay prevented by browser:", error);
          setIsAudioPlaying(false);
        });
        setIsAudioPlaying(true);
      } else {
        audioRef.current.pause();
        setIsAudioPlaying(false);
      }
    }
  };

  return (
    <div className={containerClass}>
      {/* All AGENT messages (including auto-generated) show on right, CUSTOMER on left */}
      {sender === "CUSTOMER" || sender === "AGENT" ? (
        <div className={bubbleClass}>
          {/* IMAGE */}
          {contentType === "IMAGE" && (
            <div className="relative box-border">
              {!imgError && fileName && fileName.trim() !== "" ? (
                <img
                  src={fileName}
                  alt="chat-img"
                  onError={() => setImgError(true)}
                  onClick={() => openMediaPopup("IMAGE", fileName, "Image")}
                  className="mb-4 w-full max-w-[240px] max-h-[300px] object-cover rounded-md cursor-pointer transition-transform duration-200 ease-in-out hover:scale-[1.05] hover:z-2"
                />
              ) : (
                <div className="relative mb-4 min-w-[240px] w-fit  h-[150px] flex items-center justify-center bg-gray-200 text-gray-600 text-xs rounded-md object-cover">
                  No Preview
                </div>
              )}
            </div>
          )}
          {/* VIDEO */}
          {contentType === "VIDEO" && (
            <div className="relative w-full h-64 overflow-hidden rounded-lg shadow-md">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                src={
                  fileName && fileName.trim() !== ""
                    ? fileName
                    : "/SampleVideo_360x240_30mb.mp4"
                }
                preload="metadata"
                onClick={handleVideoToggle}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
              />
              {/* Play/Pause Overlay Button */}
              <button
                onClick={handleVideoToggle}
                className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition"
              >
                {isPlaying ? (
                  // Pause icon
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="50"
                    height="50"
                    fill="white"
                    viewBox="0 0 24 24"
                  >
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  // Play icon
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="50"
                    height="50"
                    fill="white"
                    viewBox="0 0 24 24"
                  >
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                )}
              </button>

              {/* Fullscreen button */}
              <button
                onClick={() =>
                  openMediaPopup(
                    "VIDEO",
                    fileName || "/SampleVideo_360x240_30mb.mp4",
                    "Video",
                  )
                }
                className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition"
                title="Open in fullscreen"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </svg>
              </button>
            </div>
          )}
          {/* DOCUMENT */}
          {contentType === "DOCUMENT" &&
            (() => {
              // Determine file type from fileName
              const getFileType = (fileName) => {
                const ext = fileName?.split(".").pop()?.toLowerCase() || "";
                if (["pdf"].includes(ext))
                  return { type: "PDF", color: "#DC2626", icon: "pdf" };
                if (["doc", "docx"].includes(ext))
                  return { type: "Word", color: "#2B579A", icon: "word" };
                if (["xls", "xlsx"].includes(ext))
                  return { type: "Excel", color: "#217346", icon: "excel" };
                if (["ppt", "pptx"].includes(ext))
                  return { type: "PowerPoint", color: "#D24726", icon: "ppt" };
                if (["txt"].includes(ext))
                  return { type: "Text", color: "#6B7280", icon: "text" };
                if (["zip", "rar", "7z"].includes(ext))
                  return { type: "Archive", color: "#F59E0B", icon: "zip" };
                return { type: "Document", color: "#6B7280", icon: "generic" };
              };

              const fileInfo = getFileType(fileName);

              // Icon paths for different file types
              const icons = {
                pdf: "M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M10.5,11.5C10.5,10.67 11.17,10 12,10C12.83,10 13.5,10.67 13.5,11.5V15.5C13.5,16.33 12.83,17 12,17C11.17,17 10.5,16.33 10.5,15.5V11.5M15,11H16V17H15V11M8,11H10V12H9V17H8V11Z",
                word: "M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M15,18V16H13V15H15V13H16V15H18V16H16V18H15M10,18H8L7,15L6,18H4L6,13H8L10,18Z",
                excel:
                  "M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M12,19L14,15H16L13,19L16,23H14L12,19M8,15H10L11,17L12,15H14L11,19L14,23H12L11,21L10,23H8L11,19L8,15Z",
                ppt: "M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M10,18V16H8V13H10C11.1,13 12,13.9 12,15C12,16.1 11.1,17 10,17H9V18H10M10,14H9V16H10A1,1 0 0,0 11,15A1,1 0 0,0 10,14Z",
                text: "M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M10,19H8V17H10V19M14,19H12V17H14V19M10,16H8V14H10V16M14,16H12V14H14V16M10,13H8V11H10V13M14,13H12V11H14V13Z",
                zip: "M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M10,19L12,17H11V13H13L11,15H12V19H10Z",
                generic:
                  "M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z",
              };

              return (
                <div className="mb-4 flex flex-col items-center gap-2  border w-[240px] rounded-md border-gray-300  bg-gray-50 overflow-hidden">
                  {fileName && (
                    <div
                      className="w-full h-40 bg-gray-100 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors border-none"
                      onClick={() => window.open(fileName, "_blank")}
                    >
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill={fileInfo.color}
                        className="mb-2"
                      >
                        <path d={icons[fileInfo.icon]} />
                      </svg>
                      <p className="text-xs text-gray-600 font-medium">
                        Click to view {fileInfo.type}
                      </p>
                      <p className="text-xs text-gray-500">Opens in new tab</p>
                    </div>
                  )}
                  <div
                    onClick={() => window.open(fileName, "_blank")}
                    className="min-w-60 flex items-center p-2 w-full bg-[#1a3d2f] text-white cursor-pointer hover:bg-[#204d3a] transition rounded-bl-md rounded-br-md"
                  >
                    <div className="flex-1 mt-2">
                      <p className="font-medium text-sm truncate">
                        {"document"}
                      </p>
                      <p className="text-xs text-gray-300">
                        {Math.round(10000 / 1024)} KB • {fileInfo.type}
                      </p>
                    </div>
                    <div
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(fileName);
                      }}
                    >
                      {" "}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 text-[#33333380] hover:text-[#333333] transition-colors"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })()}
          {contentType === "audio" && (
            <div className="flex items-center p-3 bg-white shadow-sm">
              <button
                onClick={toggleAudioPlay}
                className="mr-3 p-2 rounded-full bg-green-500 hover:bg-green-600"
              >
                {isAudioPlaying ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="white"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="white"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              <div className="flex-1">
                <audio
                  ref={audioRef}
                  src={
                    fileName && fileName.trim() !== ""
                      ? fileName
                      : "/sunflower-street-drumloop-85bpm-163900.mp3"
                  }
                  preload="metadata"
                  onEnded={() => setIsAudioPlaying(false)}
                />
                <p className="text-sm text-gray-700 truncate">
                  {maskedMessage}
                </p>
              </div>
            </div>
          )}
          {/* TEXT */}
          {message &&
            (contentType === "TEXT" ||
              contentType === "IMAGE" ||
              contentType === "VIDEO" ||
              contentType === "DOCUMENT" ||
              contentType === "audio") && (
              <div style={{ display: "inline" }}>
                {maskedMessage}
                {/* TIMESTAMP INLINE */}
                <span
                  style={{
                    whiteSpace: "nowrap",
                    marginLeft: "8px",
                    display: "inline-flex",
                    alignItems: "flex-end",
                    gap: "3px",
                    verticalAlign: "bottom",
                  }}
                >
                  <span
                    className="text-[11px] text-[#667781]"
                    style={{ lineHeight: "1" }}
                  >
                    {timestamp}
                  </span>
                  {isUser && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "flex-end",
                        marginLeft: "0px",
                        lineHeight: "1",
                        verticalAlign: "baseline",
                        marginBottom: "-2px",
                      }}
                    >
                      {messageStatus === "SENT" ? (
                        <SingleTickIcon color={"#667781"} />
                      ) : messageStatus === "SEEN" ? (
                        <DoubleTickIcon color={"#53bdeb"} />
                      ) : (
                        <DoubleTickIcon color={"#667781"} />
                      )}
                    </span>
                  )}
                </span>
              </div>
            )}

          {/* TIMESTAMP FOR MEDIA-ONLY MESSAGES */}
          {!message &&
            (contentType === "IMAGE" ||
              contentType === "VIDEO" ||
              contentType === "DOCUMENT" ||
              contentType === "audio") && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "4px",
                }}
              >
                <span
                  style={{
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "flex-end",
                    gap: "3px",
                  }}
                >
                  <span
                    className="text-[11px] text-[#667781]"
                    style={{ lineHeight: "1" }}
                  >
                    {timestamp}
                  </span>
                  {isUser && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "flex-end",
                        marginLeft: "0px",
                        lineHeight: "1",
                        verticalAlign: "baseline",
                        marginBottom: "-2px",
                      }}
                    >
                      {messageStatus === "SENT" ? (
                        <SingleTickIcon color={"#667781"} />
                      ) : messageStatus === "SEEN" ? (
                        <DoubleTickIcon color={"#53bdeb"} />
                      ) : (
                        <DoubleTickIcon color={"#667781"} />
                      )}
                    </span>
                  )}
                </span>
              </div>
            )}
        </div>
      ) : (
        <div className="relative w-full my-2  bottom-1 flex justify-center items-center text-gray-500 text-xs ">
          <span className="bg-[#FFFBEA] border border-[#F9C747] px-3 py-1 rounded-md text-xs  text-[#6B5900] shadow-[0_2px_2px_-1px_rgba(249,199,71,0.50)]">
            {maskedMessage}
          </span>
        </div>
      )}

      {/* Media Popup */}
      <MediaPopup
        isOpen={showMediaPopup}
        onClose={() => setShowMediaPopup(false)}
        mediaData={popupMediaData}
      />
    </div>
  );
}

export default ChatMessageBubble;
