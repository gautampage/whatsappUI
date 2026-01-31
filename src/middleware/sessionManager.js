/**
 * Session utility functions for managing session tokens and data from URL parameters
 */
export class SessionManager {
  /**
   * Get URL search parameters
   * @returns {URLSearchParams} URL search parameters
   */
  static getURLParams() {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }

  /**
   * Get the current session token from URL parameters
   * @returns {string|null} The session token or null if not found
   */
  static getToken() {
    const params = this.getURLParams();
    return params.get("token");
  }

  /**
   * Get the agent ID from URL parameters
   * @returns {string|null} The agent ID or null if not found
   */
  static getAgentId() {
    const params = this.getURLParams();
    return params.get("agentId");
  }

  /**
   * Get the role ID from URL parameters
   * @returns {string|null} The role ID or null if not found
   */
  static getRoleId() {
    const params = this.getURLParams();
    return params.get("roleId");
  }

  /**
   * Get all URL parameters as an object
   * @returns {object} Object containing token, agentId, roleId
   */
  static getAllParams() {
    return {
      token: this.getToken(),
      agentId: this.getAgentId(),
      roleId: this.getRoleId(),
    };
  }

  /**
   * Check if session token exists in URL parameters
   * @returns {boolean} True if session is valid, false otherwise
   */
  static isSessionValid() {
    const token = this.getToken();
    const agentId = this.getAgentId();
    const roleId = this.getRoleId();

    return !!(token && agentId && roleId);
  }

  /**
   * Get session information including validity status
   * @returns {object} Session info object
   */
  static getSessionInfo() {
    const token = this.getToken();
    const agentId = this.getAgentId();
    const roleId = this.getRoleId();
    const isValid = this.isSessionValid();

    return {
      token,
      agentId,
      roleId,
      isValid,
      isExpired: false, // URL params don't expire
      expiresAt: null,
      team: null,
    };
  }

  /**
   * Clear session data (redirect to home since we can't clear URL params)
   */
  static clearSession() {
    if (typeof window !== "undefined") {
      console.log("🔄 Redirecting to clear session");
      window.location.href = "/";
    }
  }

  /**
   * Get Authorization header value for API requests
   * @returns {string|null} Bearer token string or null if no token
   */
  static getAuthHeader() {
    const token = this.getToken();
    return token ? `Bearer ${token}` : null;
  }

  /**
   * Get agent details from URL parameters
   * @returns {object|null} Agent data from URL parameters
   */
  static getAgentWithSession() {
    const { token, agentId, roleId } = this.getAllParams();

    if (!token || !agentId || !roleId) return null;

    return {
      token,
      agentId,
      roleId,
      sessionInfo: this.getSessionInfo(),
    };
  }

  /**
   * Set up axios interceptor for automatic token inclusion
   * @param {object} axiosInstance - Axios instance to configure
   */
  static setupAxiosInterceptor(axiosInstance) {
    axiosInstance.interceptors.request.use(
      (config) => {
        const authHeader = this.getAuthHeader();
        if (authHeader) {
          config.headers.Authorization = authHeader;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token expiration
    axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn("🔒 Session expired, clearing session data");
          this.clearSession();
        }
        return Promise.reject(error);
      }
    );
  }
}

/**
 * React hook for session management
 */
export const useSession = () => {
  const getSessionInfo = () => SessionManager.getSessionInfo();
  const isValid = SessionManager.isSessionValid();
  const token = SessionManager.getToken();

  return {
    token,
    isValid,
    sessionInfo: getSessionInfo(),
    clearSession: SessionManager.clearSession,
    getAuthHeader: SessionManager.getAuthHeader,
  };
};

export default SessionManager;
