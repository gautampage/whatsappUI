# Customer Selection PostMessage Integration

This guide explains how the WhatsApp Chat Service UI sends selected customer information back to the parent application.

## 🎯 Overview

When a user clicks on a customer in the sidebar, the application automatically sends the customer details to the parent application using the PostMessage API.

## 📡 Message Formats

### Customer Selection Message

When a customer is selected, the following message is sent to the parent:

```javascript
{
  type: "CUSTOMER_SELECTED",
  payload: {
    customerId: "12345",
    customerName: "John Doe",
    sessionStatus: "ACTIVE",
    unreadCount: 3,
    waitTime: "2H 15M",
    lastInteractionAt: "2:30 PM",
    timestamp: "2025-09-15T10:30:00.000Z"
  }
}
```

### Search Performed Message

When the search button is clicked, the following message is sent to the parent:

```javascript
{
  type: "SEARCH_PERFORMED",
  payload: {
    searchString: "customer name or ID",
    timestamp: "2025-09-15T10:30:00.000Z",
    searchType: "customer_search"
  }
}
```

### Search Cleared Message

When the search is cleared (X button clicked), the following message is sent to the parent:

```javascript
{
  type: "SEARCH_CLEARED",
  payload: {
    timestamp: "2025-09-15T10:30:00.000Z",
    action: "search_cleared"
  }
}
```

## 🔧 Implementation Details

### In the Sidebar Component

The sidebar uses the `usePostMessage` hook to send messages:

```javascript
import usePostMessage from "../middleware/usePostMessage";

// Initialize PostMessage
const { sendMessageToParent } = usePostMessage({
  allowedOrigins: [], // Add your allowed origins for security
  storeInLocalStorage: false,
});

// Send message when customer is clicked
sendMessageToParent({
  type: "CUSTOMER_SELECTED",
  payload: {
    customerId: user.customerId,
    customerName: user.customerName,
    sessionStatus: user.sessionStatus,
    unreadCount: user.unreadCount,
    waitTime: user.waitTime,
    lastInteractionAt: user.lastInteractionAt,
    timestamp: new Date().toISOString(),
  },
});
```

## 👂 Parent Application Listener

The parent application should listen for these messages:

```javascript
window.addEventListener("message", function (event) {
  // Verify the message is from your iframe
  if (event.source === iframe.contentWindow) {
    // Handle customer selection
    if (event.data && event.data.type === "CUSTOMER_SELECTED") {
      const customerData = event.data.payload;

      console.log("Selected Customer:", customerData.customerId);
      console.log("Customer Name:", customerData.customerName);

      // Your custom logic here
      handleCustomerSelection(customerData);
    }
  }
});

function handleCustomerSelection(customerData) {
  // Update your parent application state
  // Make API calls
  // Update UI
  // etc.
}
```

## 🧪 Testing

1. **Run the application**: `npm run dev`
2. **Open parent test**: Navigate to `http://localhost:3001/parent-test.html`
3. **Test customer selection**: Click on any customer in the sidebar
4. **View the logs**: Check the message log at the bottom of the parent page

## 🛡️ Security Considerations

1. **Origin Validation**: Always validate the origin of incoming messages
2. **Data Validation**: Validate the structure and content of received data
3. **Allowed Origins**: Configure `allowedOrigins` in the usePostMessage hook

```javascript
const { sendMessageToParent } = usePostMessage({
  allowedOrigins: ["https://your-parent-domain.com"],
  storeInLocalStorage: false,
});
```

## 📋 Available Data Fields

### Customer Selection Fields

| Field               | Type   | Description                         |
| ------------------- | ------ | ----------------------------------- |
| `customerId`        | string | Unique customer identifier          |
| `customerName`      | string | Customer display name               |
| `sessionStatus`     | string | Current session status              |
| `unreadCount`       | number | Number of unread messages           |
| `waitTime`          | string | Customer wait time (e.g., "2H 15M") |
| `lastInteractionAt` | string | Last interaction timestamp          |
| `timestamp`         | string | When the selection occurred         |

### Search Fields

| Field          | Type   | Description                                  |
| -------------- | ------ | -------------------------------------------- |
| `searchString` | string | The search query entered by user             |
| `searchType`   | string | Type of search (e.g., "customer_search")     |
| `timestamp`    | string | When the search was performed                |
| `action`       | string | Action performed (for search cleared events) |

## 🚀 Usage Examples

### Complete Message Handling

```javascript
window.addEventListener("message", function (event) {
  // Customer selection
  if (event.data?.type === "CUSTOMER_SELECTED") {
    const customerId = event.data.payload.customerId;
    console.log("Selected customer ID:", customerId);
    handleCustomerSelection(event.data.payload);
  }

  // Search performed
  if (event.data?.type === "SEARCH_PERFORMED") {
    const searchString = event.data.payload.searchString;
    console.log("Search performed:", searchString);
    handleSearchQuery(searchString);
  }

  // Search cleared
  if (event.data?.type === "SEARCH_CLEARED") {
    console.log("Search cleared");
    handleSearchCleared();
  }
});
```

### React Parent Application

```jsx
import { useEffect } from "react";

function ParentApp() {
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === "CUSTOMER_SELECTED") {
        const { customerId, customerName } = event.data.payload;

        // Update your state
        setSelectedCustomer({ customerId, customerName });

        // Make API call
        fetchCustomerDetails(customerId);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div>
      <iframe src="http://localhost:3001/chat?token=xxx&agentId=xxx&roleId=xxx" />
    </div>
  );
}
```

### Vanilla JavaScript

```javascript
window.addEventListener("message", function (event) {
  if (event.data?.type === "CUSTOMER_SELECTED") {
    const customer = event.data.payload;

    // Update DOM
    document.getElementById(
      "selectedCustomer"
    ).textContent = `Selected: ${customer.customerName} (ID: ${customer.customerId})`;

    // Store in variable
    window.currentCustomer = customer;

    // Trigger custom event
    document.dispatchEvent(
      new CustomEvent("customerSelected", {
        detail: customer,
      })
    );
  }
});
```

## 🔄 Integration Flow

1. **User clicks customer** in sidebar
2. **Sidebar sends PostMessage** to parent with customer data
3. **Parent receives message** and handles it
4. **Parent can then**:
   - Update its own UI
   - Make API calls with the customer ID
   - Store customer information
   - Trigger other actions

This integration provides a seamless way for the parent application to receive customer selection events from the embedded chat interface.
