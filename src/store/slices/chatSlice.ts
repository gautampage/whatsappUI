import { createSlice } from "@reduxjs/toolkit";

export type ChatMessage = {
  content: string;
  contentType: string;
  timestamp: string; // e.g. "Jul 21, 2025, 11:36:08 AM"
  sender: string;
  formattedTime: string;
};
type GroupedMessages = Record<string, ChatMessage[]>; // "21 Jul 2025": [ ... ]

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    activeChatId: null,
    messages: <GroupedMessages>{},
    chatUser: null,
    origMessages: <GroupedMessages>{},
    havingLatestMsg: false,
    sessionStatus: false,
    searchString: "",
    accessPermissions: {
      hasSupervisorAccess: false,
      hasTeamAccess: false,
      hasProfileAccess: false,
      hasPaymentLinkAccess: false,
      hasCampaignUploadAccess: false,
      hasActiveAgentAccess: false,
    },
  },
  reducers: {
    setActiveChatId: (state, action) => {
      state.activeChatId = action.payload;
      // state.messages = null; // clear old messages
    },
    setSearchStringRedux: (state, action) => {
      state.searchString = action.payload;
      // state.messages = null; // clear old messages
    },

    setOrigMessages: (state, action) => {
      console.log("some data", action.payload);
      state.origMessages = action.payload;
    },
    setMessagesSlice: (state, action) => {
      state.messages = action.payload;
      console.log("final store", action.payload);
      return state;
    },
    setActiveUser: (state, action) => {
      state.chatUser = action.payload;
    },
    clearMessages: (state, action) => {
      state.messages = null;
      state.activeChatId = null;
      state.chatUser = null;
      state.origMessages = null;
    },
    setSessionStatus: (state, action) => {
      state.sessionStatus = action.payload;
    },
    setAccessPermissions: (state, action) => {
      state.accessPermissions = action.payload;
    },
  },
});

export const {
  setActiveChatId,
  setMessagesSlice,
  setActiveUser,
  clearMessages,
  setOrigMessages,
  setSessionStatus,
  setSearchStringRedux,
  setAccessPermissions,
} = chatSlice.actions;
export default chatSlice.reducer;
