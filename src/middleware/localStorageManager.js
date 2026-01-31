export const LocalStorageKeys = {
  POST_MESSAGES: "postMessageHistory",
  LATEST_MESSAGE: "latestPostMessage",
  AGENT_DETAILS: "agentDetails",
  USER_DATA: "userData",
  APP_CONFIG: "appConfiguration",
  SESSION_TOKEN: "sessionToken",
  SESSION_DATA: "sessionData",
};

export class LocalStorageManager {
  static setItem(key, value) {
    try {
      const serializedValue = JSON.stringify({
        data: value,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem(key, serializedValue);
      console.log(`📦 Stored in localStorage: ${key}`);
      return true;
    } catch (error) {
      console.error("Error saving to localStorage:", error);
      return false;
    }
  }

  static getItem(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      // Return data if it exists, otherwise return the whole object (for backward compatibility)
      return parsed.data || parsed;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return null;
    }
  }

  static removeItem(key) {
    try {
      localStorage.removeItem(key);
      console.log(`🗑️ Removed from localStorage: ${key}`);
      return true;
    } catch (error) {
      console.error("Error removing from localStorage:", error);
      return false;
    }
  }

  static clearPostMessages() {
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith("postMessage_")
    );

    keys.forEach((key) => {
      localStorage.removeItem(key);
    });

    this.removeItem(LocalStorageKeys.POST_MESSAGES);
    this.removeItem(LocalStorageKeys.LATEST_MESSAGE);
    console.log("🧹 Cleared all PostMessage data from localStorage");
  }

  static getPostMessageHistory() {
    return this.getItem(LocalStorageKeys.POST_MESSAGES) || [];
  }

  static getLatestPostMessage() {
    return this.getItem(LocalStorageKeys.LATEST_MESSAGE);
  }

  static storePostMessage(messageData) {
    // Store individual message
    this.setItem(`postMessage_${messageData.id}`, messageData);

    // Update latest message
    this.setItem(LocalStorageKeys.LATEST_MESSAGE, messageData);

    // Update message history
    const history = this.getPostMessageHistory();
    history.unshift(messageData);
    const limitedHistory = history.slice(0, 50); // Keep only last 50 messages
    this.setItem(LocalStorageKeys.POST_MESSAGES, limitedHistory);

    return messageData;
  }

  static getAllStoredData() {
    return {
      postMessages: this.getPostMessageHistory(),
      latestMessage: this.getLatestPostMessage(),
      agentDetails: this.getItem(LocalStorageKeys.AGENT_DETAILS),
      userData: this.getItem(LocalStorageKeys.USER_DATA),
      appConfig: this.getItem(LocalStorageKeys.APP_CONFIG),
      sessionToken: this.getItem(LocalStorageKeys.SESSION_TOKEN),
      sessionData: this.getItem(LocalStorageKeys.SESSION_DATA),
    };
  }

  // Session token specific methods
  static setSessionToken(token) {
    try {
      localStorage.setItem(LocalStorageKeys.SESSION_TOKEN, token);
      console.log("🔐 Session token stored successfully");
      return true;
    } catch (error) {
      console.error("Error storing session token:", error);
      return false;
    }
  }

  static getSessionToken() {
    try {
      return localStorage.getItem(LocalStorageKeys.SESSION_TOKEN);
    } catch (error) {
      console.error("Error retrieving session token:", error);
      return null;
    }
  }

  static setSessionData(sessionData) {
    this.setItem(LocalStorageKeys.SESSION_DATA, sessionData);
  }

  static getSessionData() {
    return this.getItem(LocalStorageKeys.SESSION_DATA);
  }

  static clearSession() {
    this.removeItem(LocalStorageKeys.SESSION_TOKEN);
    this.removeItem(LocalStorageKeys.SESSION_DATA);
    console.log("🧹 Session data cleared");
  }
}

export default LocalStorageManager;
