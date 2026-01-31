import { combineReducers } from "@reduxjs/toolkit";
import testingSlice from "./slices/testing.slice";
import chatSlice from "./slices/chatSlice";
import { chatAPI } from "./slices/chatAPI";
import agentSlice from "./slices/agent.slice";

export const rootReducer = combineReducers({
  testingSlice: testingSlice,
  chatSlice: chatSlice,
  agentDetails: agentSlice,
  [chatAPI.reducerPath]: chatAPI.reducer,
});

export default rootReducer;
