import SessionManager from "./sessionManager";

/**
 * API Authorization wrapper that checks for valid session before making API calls
 */
export class ApiAuthWrapper {
  /**
   * Wrap an API function to check for valid session before execution
   * @param {Function} apiFunction - The API function to wrap
   * @param {string} apiName - Name of the API for logging
   * @returns {Function} Wrapped API function
   */
  static wrapApiCall(apiFunction, apiName = "API") {
    return async (...args) => {
      console.log(`🔐 Checking authorization for ${apiName} call...`);

      // Check if session is valid
      if (!SessionManager.isSessionValid()) {
        const errorMessage = `🚫 ${apiName} call blocked - No valid session token`;
        console.error(errorMessage);

        // Clear session and redirect
        SessionManager.clearSession();

        if (typeof window !== "undefined") {
          window.location.href = "/";
        }

        throw new Error("No valid session token");
      }

      console.log(`✅ Session valid - proceeding with ${apiName} call`);

      try {
        return await apiFunction(...args);
      } catch (error) {
        // Handle auth-related errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.error(`🚫 ${apiName} call unauthorized - clearing session`);
          SessionManager.clearSession();

          if (typeof window !== "undefined") {
            window.location.href = "/";
          }
        }
        throw error;
      }
    };
  }

  /**
   * Check if API calls are authorized
   * @returns {boolean} True if authorized, false otherwise
   */
  static isAuthorized() {
    const isValid = SessionManager.isSessionValid();
    console.log(
      `🔐 API Authorization check: ${isValid ? "Authorized" : "Not authorized"}`
    );
    return isValid;
  }

  /**
   * Guard function that throws an error if not authorized
   */
  static requireAuth() {
    if (!this.isAuthorized()) {
      SessionManager.clearSession();
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
      throw new Error("Authentication required");
    }
  }
}

/**
 * React hook for API authorization checks
 */
export const useApiAuth = () => {
  const isAuthorized = () => ApiAuthWrapper.isAuthorized();

  const requireAuth = () => ApiAuthWrapper.requireAuth();

  const wrapApiCall = (apiFunction, apiName) => {
    return ApiAuthWrapper.wrapApiCall(apiFunction, apiName);
  };

  return {
    isAuthorized,
    requireAuth,
    wrapApiCall,
  };
};

export default ApiAuthWrapper;
