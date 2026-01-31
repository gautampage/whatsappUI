import { useEffect, useRef, useState } from "react";

const MediaPopup = ({ isOpen, onClose, mediaData }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const imageRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Reset zoom and position when opening new media
      setZoomLevel(1);
      setImagePosition({ x: 0, y: 0 });
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleImageLoad = (e) => {
    const img = e.target;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
    setIsLoading(false);
  };

  const getImageDisplayStyle = () => {
    if (!imageDimensions.width || !imageDimensions.height) return {};

    const viewportWidth = window.innerWidth - 128; // Account for padding
    const viewportHeight = window.innerHeight - 128;
    const aspectRatio = imageDimensions.width / imageDimensions.height;
    const viewportAspectRatio = viewportWidth / viewportHeight;

    let displayWidth, displayHeight;

    if (aspectRatio > viewportAspectRatio) {
      // Image is wider - fit to width
      displayWidth = Math.min(imageDimensions.width, viewportWidth);
      displayHeight = displayWidth / aspectRatio;
    } else {
      // Image is taller - fit to height
      displayHeight = Math.min(imageDimensions.height, viewportHeight);
      displayWidth = displayHeight * aspectRatio;
    }

    return {
      width: `${displayWidth * zoomLevel}px`,
      height: `${displayHeight * zoomLevel}px`,
      transform: `translate(${imagePosition.x}px, ${imagePosition.y}px)`,
      transition: isDragging ? "none" : "transform 0.2s ease-out",
      cursor: zoomLevel > 1 ? "grab" : "zoom-in",
    };
  };

  const handleImageClick = (e) => {
    if (zoomLevel === 1) {
      setZoomLevel(2);
      // Zoom to click position
      const rect = imageRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left - rect.width / 2;
      const clickY = e.clientY - rect.top - rect.height / 2;
      setImagePosition({ x: -clickX, y: -clickY });
    } else {
      setZoomLevel(1);
      setImagePosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y,
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoomLevel > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    onClose();
  };

  const handleVideoToggle = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = () => {
    if (mediaData?.url) {
      window.open(mediaData.url, "_blank", "noopener,noreferrer");
    } else {
      console.warn("No media URL available for download");
    }
  };

  if (!isOpen || !mediaData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-50 p-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
            {mediaData.name && (
              <div>
                <h3 className="font-medium">{mediaData.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  {mediaData.size && <span>{mediaData.size}</span>}
                  {imageDimensions.width > 0 && (
                    <span>
                      • {imageDimensions.width} × {imageDimensions.height}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Zoom controls for images */}
            {mediaData.type === "IMAGE" && imageDimensions.width > 0 && (
              <>
                <button
                  onClick={() => {
                    setZoomLevel(Math.max(0.5, zoomLevel - 0.5));
                    if (zoomLevel <= 1) setImagePosition({ x: 0, y: 0 });
                  }}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition"
                  title="Zoom out"
                  disabled={zoomLevel <= 0.5}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7z" />
                  </svg>
                </button>
                <span className="text-sm text-gray-300 min-w-[50px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => {
                    setZoomLevel(Math.min(4, zoomLevel + 0.5));
                  }}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition"
                  title="Zoom in"
                  disabled={zoomLevel >= 4}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h2v2h1V9h2V8H10V6H9v2H7v1z" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setZoomLevel(1);
                    setImagePosition({ x: 0, y: 0 });
                  }}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition text-xs"
                  title="Reset zoom"
                >
                  1:1
                </button>
              </>
            )}

            {/* Download button */}
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition"
              title="Download"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Media Content */}
      <div className="w-full h-full flex items-center justify-center p-16">
        {mediaData.type === "IMAGE" && (
          <div className="relative flex items-center justify-center w-full h-full">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
            <div className="relative overflow-hidden flex items-center justify-center">
              <img
                ref={imageRef}
                src={mediaData.url}
                alt={mediaData.name || "Image"}
                style={getImageDisplayStyle()}
                onLoad={handleImageLoad}
                onError={() => setIsLoading(false)}
                onClick={handleImageClick}
                onMouseDown={handleMouseDown}
                className="select-none"
                draggable={false}
              />
            </div>

            {/* Zoom indicator */}
            {zoomLevel > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {Math.round(zoomLevel * 100)}%
              </div>
            )}

            {/* Image info overlay */}
            {imageDimensions.width > 0 && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-xs">
                {imageDimensions.width} × {imageDimensions.height}
              </div>
            )}
          </div>
        )}

        {mediaData.type === "VIDEO" && (
          <div className="relative max-w-full max-h-full">
            <video
              ref={videoRef}
              src={mediaData.url}
              className="max-w-full max-h-full object-contain"
              controls
              preload="metadata"
              onLoadedData={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </div>
        )}

        {mediaData.type === "DOCUMENT" &&
          (() => {
            // Determine file type from URL or name
            const getFileType = (url) => {
              const fileName = url?.split("/").pop() || "";
              const ext = fileName?.split(".").pop()?.toLowerCase() || "";
              if (["pdf"].includes(ext))
                return {
                  type: "PDF",
                  color: "#DC2626",
                  bgColor: "bg-red-100",
                  btnColor: "bg-red-600 hover:bg-red-700",
                  icon: "pdf",
                };
              if (["doc", "docx"].includes(ext))
                return {
                  type: "Word Document",
                  color: "#2B579A",
                  bgColor: "bg-blue-100",
                  btnColor: "bg-blue-600 hover:bg-blue-700",
                  icon: "word",
                };
              if (["xls", "xlsx"].includes(ext))
                return {
                  type: "Excel Spreadsheet",
                  color: "#217346",
                  bgColor: "bg-green-100",
                  btnColor: "bg-green-600 hover:bg-green-700",
                  icon: "excel",
                };
              if (["ppt", "pptx"].includes(ext))
                return {
                  type: "PowerPoint Presentation",
                  color: "#D24726",
                  bgColor: "bg-orange-100",
                  btnColor: "bg-orange-600 hover:bg-orange-700",
                  icon: "ppt",
                };
              if (["txt"].includes(ext))
                return {
                  type: "Text File",
                  color: "#6B7280",
                  bgColor: "bg-gray-100",
                  btnColor: "bg-gray-600 hover:bg-gray-700",
                  icon: "text",
                };
              if (["zip", "rar", "7z"].includes(ext))
                return {
                  type: "Archive",
                  color: "#F59E0B",
                  bgColor: "bg-yellow-100",
                  btnColor: "bg-yellow-600 hover:bg-yellow-700",
                  icon: "zip",
                };
              return {
                type: "Document",
                color: "#6B7280",
                bgColor: "bg-gray-100",
                btnColor: "bg-gray-600 hover:bg-gray-700",
                icon: "generic",
              };
            };

            const fileInfo = getFileType(mediaData.url);

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
              <div className="w-full h-full flex items-center justify-center">
                <div className="bg-white rounded-lg p-12 max-w-md w-full shadow-xl">
                  <div className="flex flex-col items-center gap-6">
                    <div
                      className={`w-24 h-24 ${fileInfo.bgColor} rounded-full flex items-center justify-center`}
                    >
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill={fileInfo.color}
                      >
                        <path d={icons[fileInfo.icon]} />
                      </svg>
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-gray-900 text-lg mb-2">
                        {mediaData.name || fileInfo.type}
                      </h3>
                      {mediaData.size && (
                        <p className="text-sm text-gray-500 mb-4">
                          {mediaData.size}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mb-6">
                        Documents cannot be displayed inline due to browser
                        security restrictions.
                      </p>
                    </div>
                    <div className="flex gap-3 w-full">
                      <button
                        onClick={() => window.open(mediaData.url, "_blank")}
                        className={`flex-1 ${fileInfo.btnColor} text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2`}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
                        </svg>
                        Open in New Tab
                      </button>
                      <button
                        onClick={handleDownload}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                        </svg>
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        {mediaData.type === "AUDIO" && (
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C13.1 2 14 2.9 14 4V12C14 13.1 13.1 14 12 14C10.9 14 10 13.1 10 12V4C10 2.9 10.9 2 12 2ZM19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10H7V12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12V10H19ZM10 21H14V23H10V21Z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="font-medium text-gray-900">
                  {mediaData.name || "Audio File"}
                </h3>
                {mediaData.size && (
                  <p className="text-sm text-gray-500">{mediaData.size}</p>
                )}
              </div>
              <audio
                src={mediaData.url}
                controls
                className="w-full"
                onLoadedData={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Close overlay (click outside to close) */}
      <div className="absolute inset-0 -z-10" onClick={handleClose} />
    </div>
  );
};

export default MediaPopup;
