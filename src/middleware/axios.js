import axios from "axios";
import { enqueueSnackbar } from "notistack";
// import { decrypt, encrypt } from "../lib/enc-decrypt/index";
import { decrypt, encrypt } from "../lib/enc-decrypt/index";
import { randomUUID } from "./randomId";
import SessionManager from "./sessionManager";

const ES_DOMAIN = process.env.NEXT_PUBLIC_ES_DOMAIN;
const runInProduction = ["qa", "development", "production"];

// Track active requests for loader management
let activeRequests = 0;
let loaderCallbacks = { show: null, hide: null };

// Function to register loader callbacks
export const registerLoaderCallbacks = (showLoader, hideLoader) => {
  loaderCallbacks.show = showLoader;
  loaderCallbacks.hide = hideLoader;
};

// Helper to manage loader visibility
const showGlobalLoader = () => {
  if (activeRequests === 0 && loaderCallbacks.show) {
    loaderCallbacks.show();
  }
  activeRequests++;
};

const hideGlobalLoader = () => {
  activeRequests--;
  if (activeRequests <= 0) {
    activeRequests = 0;
    if (loaderCallbacks.hide) {
      loaderCallbacks.hide();
    }
  }
};

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_ES_BASE_URL?.replace(
    `{ES_DOMAIN}`,
    ES_DOMAIN
  ),
});
const esInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_ES_NEW_BASE_URL?.replace(
    `{ES_DOMAIN}`,
    ES_DOMAIN
  ),
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Debug log to verify skipLoader flag
    console.log('🔍 Request interceptor - URL:', config.url, 'skipLoader:', config.skipLoader);
    
    // Only show loader if not explicitly skipped (for background/polling requests)
    if (!config.skipLoader) {
      showGlobalLoader();
    }
    
    // Get session token directly from URL parameters
    const sessionToken = SessionManager.getToken();
    const agentId = SessionManager.getAgentId();
    const roleId = SessionManager.getRoleId();

    if (!sessionToken || !agentId || !roleId) {
      console.error("🚫 Missing required URL parameters - API call blocked", {
        token: !!sessionToken,
        agentId: !!agentId,
        roleId: !!roleId,
      });
      // Hide loader on error (only if it was shown)
      if (!config.skipLoader) {
        hideGlobalLoader();
      }
      // Redirect to home page
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
      return Promise.reject(new Error("Missing required URL parameters"));
    }

    const _requestId = randomUUID();
    // const reqFor = config?.data?.requestFor;

    console.warn(
      "%cRequest",
      "color: red;background-color:#faafb0;font-weight:bold",
      _requestId,
      config.url,
      config.data
      // encrypt(process.env.NEXT_ENC_KEY, config.data)
    );

    if (runInProduction.includes(process.env.NEXT_PUBLIC_APP_ENVIRONMENT)) {
      // console.log("inside if");
      if (!config.url.split("/").includes("cnpreprod")) {
        const _configData = JSON.parse(JSON.stringify(config.data));
        _configData["team"] = "COLLECTION";
        const reqPayload = {
          data: encrypt(process.env.NEXT_ENC_KEY, _configData),
          requestId: _requestId,
        };
        config.data = reqPayload;
      } else {
        // For cnpreprod URLs, don't encrypt but add requestId
        config.data.team = "COLLECTION";
        config.data.requestId = _requestId;
      }
    } else {
      // For non-production environments without encryption requirement
      config.data.team = "COLLECTION";
      config.data.requestId = _requestId;
    }
    config.headers["x-api-key"] = decrypt(
      process.env.NEXT_ENC_KEY,
      process.env.NEXT_PUBLIC_X_API_KEY
    );
    config.headers["Authorization"] = sessionToken;
    return config;
  },
  (error) => {
    // Hide loader on request error (only if it was shown)
    if (!error.config?.skipLoader) {
      hideGlobalLoader();
    }
    return Promise.reject(error);
  }
);

esInstance.interceptors.request.use(
  (config) => {
    // Only show loader if not explicitly skipped (for background/polling requests)
    if (!config.skipLoader) {
      showGlobalLoader();
    }
    
    // Get session token and agentId directly from URL parameters
    const sessionToken = SessionManager.getToken();
    const agentId = SessionManager.getAgentId();
    const roleId = SessionManager.getRoleId();

    if (!sessionToken || !agentId || !roleId) {
      console.error(
        "🚫 Missing required URL parameters - ES API call blocked",
        {
          token: !!sessionToken,
          agentId: !!agentId,
          roleId: !!roleId,
        }
      );
      // Hide loader on error (only if it was shown)
      if (!config.skipLoader) {
        hideGlobalLoader();
      }
      // Redirect to home page
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
      return Promise.reject(new Error("Missing required URL parameters"));
    }

    const _requestId = randomUUID();
    // const reqFor = config?.data?.requestFor;

    console.warn(
      "%cRequest",
      "color: red;background-color:#faafb0;font-weight:bold",
      _requestId,
      config.url,
      config.data
      // encrypt(process.env.NEXT_ENC_KEY, config.data)
    );
    config.headers["x-api-key"] = decrypt(
      process.env.NEXT_ENC_KEY,
      process.env.NEXT_PUBLIC_X_API_KEY_CARE
    );
    config.headers["x-revalidate"] = agentId;
    config.headers["source"] = "internal";
    config.headers["Authorization"] = sessionToken;
    return config;
  },
  (error) => {
    // Hide loader on request error (only if it was shown)
    if (!error.config?.skipLoader) {
      hideGlobalLoader();
    }
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Hide loader on successful response (only if it was shown)
    if (!response.config?.skipLoader) {
      hideGlobalLoader();
    }
    
    console.warn(
      "%cResponse",
      "color: #069937;background-color:#a1f7be;font-weight:bold",
      response?.config?.url,
      response.data
    );
    if (
      response?.data?.statusCode === 403 ||
      response?.data?.statusCode === 401
    ) {
      enqueueSnackbar(
        response?.data?.message || "Session expired. Please login again.",
        {
          variant: "error",
          preventDuplicate: true,
        }
      );
      SessionManager.clearSession();
      localStorage.setItem("logout", JSON.stringify(true));
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
    if (runInProduction.includes(process.env.NEXT_PUBLIC_APP_ENVIRONMENT)) {
      if (response?.data?.encryptedResponse) {
        response.data.data = decrypt(
          process.env.NEXT_ENC_KEY,
          response.data.encryptedResponse
        );
      } else {
        response.data.data =
          response?.data?.payload ||
          response?.data?.data ||
          response?.data ||
          response;
      }
    } else {
      response.data.data =
        response?.data?.payload ||
        response?.data?.data ||
        response?.data ||
        response;
    }
    return response;
  },
  (error) => {
    // Hide loader on error response (only if it was shown)
    if (!error.config?.skipLoader) {
      hideGlobalLoader();
    }
    
    // Handle 401/403 errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error("🚫 Unauthorized - clearing session and redirecting");
      SessionManager.clearSession();
      localStorage.setItem("logout", JSON.stringify(true));
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);
esInstance.interceptors.response.use(
  (response) => {
    // Hide loader on successful response (only if it was shown)
    if (!response.config?.skipLoader) {
      hideGlobalLoader();
    }
    
    console.warn(
      "%cResponse",
      "color: #069937;background-color:#a1f7be;font-weight:bold",
      response?.config?.url,
      response.data
    );
    if (
      response?.data?.statusCode === 403 ||
      response?.data?.statusCode === 401
    ) {
      enqueueSnackbar(
        response?.data?.message || "Session expired. Please login again.",
        {
          variant: "error",
          preventDuplicate: true,
        }
      );
      SessionManager.clearSession();
      localStorage.setItem("logout", JSON.stringify(true));
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
    if (runInProduction.includes(process.env.NEXT_PUBLIC_APP_ENVIRONMENT)) {
      if (response?.data?.encryptedResponse) {
        response.data.data = decrypt(
          process.env.NEXT_ENC_KEY,
          response.data.encryptedResponse
        );
      } else {
        response.data.data =
          response?.data?.payload ||
          response?.data?.data ||
          response?.data ||
          response;
      }
    } else {
      response.data.data =
        response?.data?.payload ||
        response?.data?.data ||
        response?.data ||
        response;
    }
    return response;
  },
  (error) => {
    // Hide loader on error response (only if it was shown)
    if (!error.config?.skipLoader) {
      hideGlobalLoader();
    }
    
    // Handle 401/403 errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error("🚫 Unauthorized - clearing session and redirecting");
      SessionManager.clearSession();
      localStorage.setItem("logout", JSON.stringify(true));
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export { axiosInstance, esInstance };
