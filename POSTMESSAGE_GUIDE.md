# PostMessage Integration Guide

This guide explains how to integrate with the WhatsApp Chat Service UI using PostMessage communication.

## Overview

The WhatsApp Chat Service UI now supports receiving data from parent applications via the `postMessage` API. All received data is automatically displayed in a convenient UI panel and stored in localStorage for persistence.

## Features

✅ **PostMessage Reception**: Listens for messages from parent applications  
✅ **Visual Display**: Shows received data in an expandable panel  
✅ **LocalStorage**: Automatically stores all received messages  
✅ **Message History**: Maintains chronological history of messages  
✅ **Two-way Communication**: Can send messages back to parent  
✅ **Redux Integration**: Updates application state when appropriate  
✅ **Security**: Optional origin validation  
✅ **Error Handling**: Robust error handling for all operations

## Message Format

All messages should follow this structure:

```javascript
{
  "type": "MESSAGE_TYPE",
  "payload": {
    // Your data here
  }
}
```

## Supported Message Types

### 1. Agent Details (`AGENT_DETAILS`)

Updates agent information and Redux store.

```javascript
iframe.contentWindow.postMessage(
  {
    type: "AGENT_DETAILS",
    payload: {
      userId: 123,
      agentId: 123,
      userName: "John Doe",
      userEmail: "john.doe@example.com",
      mobileNumber: "+1234567890",
      authorizationToken: "bearer-token-123456789",
      roleId: [1, 2],
      moduleId: [10, 20],
      isVerified: true,
      isTncAccepted: true,
      isReadOnly: false,
    },
  },
  "*"
);
```

### 2. User Data (`USER_DATA`)

Stores customer/user information.

```javascript
iframe.contentWindow.postMessage(
  {
    type: "USER_DATA",
    payload: {
      customerId: 456,
      customerName: "Jane Smith",
      customerEmail: "jane.smith@example.com",
      customerPhone: "+9876543210",
      preferences: {
        language: "en",
        notifications: true,
      },
    },
  },
  "*"
);
```

### 3. Configuration (`CONFIGURATION`)

Application configuration settings.

```javascript
iframe.contentWindow.postMessage(
  {
    type: "CONFIGURATION",
    payload: {
      theme: "light",
      autoRefresh: true,
      refreshInterval: 10000,
      features: {
        aiSuggestions: true,
        fileUpload: true,
        voiceMessages: false,
      },
    },
  },
  "*"
);
```

### 4. Chat Commands (`CHAT_COMMAND`)

Control chat interface behavior.

```javascript
// Send a message to chat input
iframe.contentWindow.postMessage(
  {
    type: "CHAT_COMMAND",
    command: "SEND_MESSAGE",
    payload: {
      message: "Hello from parent!",
    },
  },
  "*"
);

// Clear chat input
iframe.contentWindow.postMessage(
  {
    type: "CHAT_COMMAND",
    command: "CLEAR_INPUT",
    payload: {},
  },
  "*"
);

// Update selected customer
iframe.contentWindow.postMessage(
  {
    type: "CHAT_COMMAND",
    command: "UPDATE_CUSTOMER",
    payload: {
      customerId: 789,
      customerName: "Bob Wilson",
    },
  },
  "*"
);
```

## Parent Application Events

The iframe will send these events back to the parent:

### 1. Ready Event (`IFRAME_READY`)

Sent when the iframe is loaded and ready.

```javascript
{
  type: 'IFRAME_READY',
  payload: {
    message: 'WhatsApp Chat UI is ready',
    timestamp: '2025-09-05T10:30:00.000Z'
  }
}
```

### 2. Chat Events (`CHAT_EVENT`)

Sent when chat activities occur.

```javascript
// Message sent event
{
  type: 'CHAT_EVENT',
  payload: {
    eventType: 'MESSAGE_SENT',
    data: {
      message: 'Hello there!',
      customerId: 456,
      timestamp: '2025-09-05T10:30:00.000Z'
    }
  }
}

// Customer changed event
{
  type: 'CHAT_EVENT',
  payload: {
    eventType: 'CUSTOMER_CHANGED',
    data: {
      customerId: 456,
      customerName: 'Jane Smith'
    }
  }
}
```

## Implementation Example

### Basic Parent Application

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Parent App</title>
  </head>
  <body>
    <button onclick="sendAgentDetails()">Send Agent Details</button>
    <button onclick="sendChatMessage()">Send Chat Message</button>

    <iframe id="chatIframe" src="http://localhost:3000/chat"></iframe>

    <script>
      const iframe = document.getElementById("chatIframe");

      // Listen for messages from iframe
      window.addEventListener("message", function (event) {
        if (event.source === iframe.contentWindow) {
          console.log("Received from iframe:", event.data);
        }
      });

      function sendAgentDetails() {
        iframe.contentWindow.postMessage(
          {
            type: "AGENT_DETAILS",
            payload: {
              userId: 123,
              userName: "John Doe",
              userEmail: "john@example.com",
              authorizationToken: "token-123",
            },
          },
          "*"
        );
      }

      function sendChatMessage() {
        iframe.contentWindow.postMessage(
          {
            type: "CHAT_COMMAND",
            command: "SEND_MESSAGE",
            payload: {
              message: "Hello from parent!",
            },
          },
          "*"
        );
      }
    </script>
  </body>
</html>
```

## Security

### Origin Validation

You can specify allowed origins for enhanced security:

```javascript
// In the chat layout or components
const { latestMessage } = usePostMessage({
  allowedOrigins: [
    "https://your-parent-domain.com",
    "https://another-allowed-domain.com",
  ],
});
```

### Best Practices

1. **Always validate origins** in production environments
2. **Use HTTPS** for production deployments
3. **Sanitize data** before processing
4. **Implement proper error handling** in parent applications
5. **Test thoroughly** with different message types

## LocalStorage Structure

The system stores data in localStorage with the following keys:

- `postMessageHistory`: Array of all received messages
- `latestPostMessage`: Most recent message received
- `agentDetails`: Current agent information
- `userData`: Current user/customer data
- `appConfiguration`: Application configuration
- `postMessage_[ID]`: Individual message entries

## Debugging

### Enable Debug Mode

The PostMessage display component includes a visual panel that shows:

- All received messages
- Message history
- Data content with JSON formatting
- Timestamps and origins
- Processing status

### Browser Console

All PostMessage activities are logged to the browser console with prefixed emojis:

- 📩 Message received
- 📤 Message sent to parent
- 📦 Data stored in localStorage
- 🎯 Processing message
- ⚠️ Warnings and errors

## Testing

Use the included test page at `/public/parent-test.html` to test PostMessage integration:

1. Open the test page in a browser
2. The page will automatically load the chat iframe
3. Use the buttons to send different types of messages
4. Watch the message log for responses
5. Check the PostMessage display panel in the iframe

## Troubleshooting

### Common Issues

1. **Messages not received**: Check browser console for origin validation errors
2. **Data not storing**: Verify localStorage is enabled and not full
3. **Redux not updating**: Ensure message format matches expected structure
4. **Visual panel not showing**: Check that component is properly imported and rendered

### Error Messages

- `Message from unauthorized origin`: Add the origin to allowedOrigins array
- `Error storing message in localStorage`: Check localStorage quota and permissions
- `Error in custom message handler`: Check your custom onMessage handler logic

## API Reference

### usePostMessage Hook

```javascript
const {
  messages, // Array of all received messages
  latestMessage, // Most recent message
  clearMessages, // Function to clear all messages
  markMessageAsProcessed, // Function to mark message as processed
  sendMessageToParent, // Function to send message to parent
} = usePostMessage({
  allowedOrigins: [], // Array of allowed origins
  onMessage: null, // Custom message handler function
  storeInLocalStorage: true, // Whether to store in localStorage
  maxStoredMessages: 50, // Maximum messages to keep in memory
});
```

### LocalStorageManager

```javascript
import LocalStorageManager from "./middleware/localStorageManager";

// Store data
LocalStorageManager.setItem("key", data);

// Retrieve data
const data = LocalStorageManager.getItem("key");

// Remove data
LocalStorageManager.removeItem("key");

// Clear all PostMessage data
LocalStorageManager.clearPostMessages();

// Get all stored data
const allData = LocalStorageManager.getAllStoredData();
```

## Support

For issues or questions about the PostMessage integration, please check:

1. Browser console for error messages
2. PostMessage display panel for received data
3. LocalStorage in browser DevTools
4. Network tab for any related API calls

This implementation provides a robust, secure, and user-friendly way to integrate with parent applications using PostMessage communication.
