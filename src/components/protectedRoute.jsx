"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SessionManager from "../middleware/sessionManager";

export const ProtectedRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuthorization = () => {
      console.log("🔐 Checking authorization from URL parameters...");

      // Get required parameters directly from URL
      const token = SessionManager.getToken();
      const agentId = SessionManager.getAgentId();
      const roleId = SessionManager.getRoleId();
      const isSessionValid = SessionManager.isSessionValid();

      console.log("URL Parameters:", {
        token: !!token,
        agentId: !!agentId,
        roleId: !!roleId,
        isValid: isSessionValid,
      });

      if (!isSessionValid) {
        console.log(
          "🚫 Missing required URL parameters (token, agentId, roleId)"
        );
        setIsAuthorized(false);
      } else {
        console.log("✅ All required URL parameters present - allowing access");
        setIsAuthorized(true);
      }

      setIsLoading(false);
    };

    // Check immediately
    checkAuthorization();

    // Set up an interval to periodically check session validity
    const interval = setInterval(checkAuthorization, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            Missing required URL parameters: token, agentId, and roleId.
          </p>
          <p className="text-sm text-gray-500">
            Please ensure your URL includes: ?token=xxx&agentId=xxx&roleId=xxx
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export const useAuthCheck = () => {
  const router = useRouter();

  const checkAuth = () => {
    const isSessionValid = SessionManager.isSessionValid();

    if (!isSessionValid) {
      console.log("🚫 Auth check failed - missing URL parameters");
      SessionManager.clearSession();
      return false;
    }

    return true;
  };

  return { checkAuth };
};

export default ProtectedRoute;
