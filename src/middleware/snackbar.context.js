"use client";
import { SnackbarProvider } from "notistack";
import { createContext } from "react";
const NotiSnackbarContext = createContext();

// Create the provider component
export const NotiSnackbarProvider = ({ children }) => {
  return (
    <>
      <style jsx global>{`
        .notistack-SnackbarContainer {
          margin-top: 16px;
        }
        
        .notistack-MuiContent {
          font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif !important;
          min-width: 320px !important;
          padding: 14px 18px !important;
          border-radius: 12px !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          position: relative !important;
          overflow: hidden !important;
        }
        
        /* Error Style */
        .notistack-MuiContent-error {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(254, 242, 242, 0.98) 100%) !important;
          color: #991b1b !important;
          border: 1px solid rgba(254, 202, 202, 0.8) !important;
          border-left: 5px solid #dc2626 !important;
          box-shadow: 0 20px 25px -5px rgba(220, 38, 38, 0.15), 0 8px 10px -6px rgba(220, 38, 38, 0.15) !important;
        }
        
        .notistack-MuiContent-error::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #dc2626 0%, #ef4444 50%, #dc2626 100%);
          background-size: 200% 100%;
          animation: shimmer 2s linear infinite;
        }
        
        /* Success Style */
        .notistack-MuiContent-success {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 253, 244, 0.98) 100%) !important;
          color: #14532d !important;
          border: 1px solid rgba(187, 247, 208, 0.8) !important;
          border-left: 5px solid #16a34a !important;
          box-shadow: 0 20px 25px -5px rgba(22, 163, 74, 0.15), 0 8px 10px -6px rgba(22, 163, 74, 0.15) !important;
        }
        
        .notistack-MuiContent-success::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #16a34a 0%, #22c55e 50%, #16a34a 100%);
          background-size: 200% 100%;
          animation: shimmer 2s linear infinite;
        }
        
        /* Warning Style */
        .notistack-MuiContent-warning {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 247, 237, 0.98) 100%) !important;
          color: #7c2d12 !important;
          border: 1px solid rgba(254, 215, 170, 0.8) !important;
          border-left: 5px solid #ea580c !important;
          box-shadow: 0 20px 25px -5px rgba(234, 88, 12, 0.15), 0 8px 10px -6px rgba(234, 88, 12, 0.15) !important;
        }
        
        .notistack-MuiContent-warning::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #ea580c 0%, #f97316 50%, #ea580c 100%);
          background-size: 200% 100%;
          animation: shimmer 2s linear infinite;
        }
        
        /* Info Style */
        .notistack-MuiContent-info {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(239, 246, 255, 0.98) 100%) !important;
          color: #1e3a8a !important;
          border: 1px solid rgba(191, 219, 254, 0.8) !important;
          border-left: 5px solid #2563eb !important;
          box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.15), 0 8px 10px -6px rgba(37, 99, 235, 0.15) !important;
        }
        
        .notistack-MuiContent-info::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #2563eb 0%, #3b82f6 50%, #2563eb 100%);
          background-size: 200% 100%;
          animation: shimmer 2s linear infinite;
        }
        
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
      <SnackbarProvider
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        autoHideDuration={5000}
        preventDuplicate={true}
        hideIconVariant={false}
        maxSnack={3}
      >
        {children}
      </SnackbarProvider>
    </>
  );
};
