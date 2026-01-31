import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  agentId: null,
  userID: null,
  userName: null,
  userEmail: null,
  roleId: [],
  moduleId: [],
  secondaryAgentId: null,
  mobileNumber: "",
  isVerified: false,
  authorizationToken: "",
  isTncAccepted: false,
  isReadOnly: false,
  impersonated: {},
};

export const agentDetailsSlice = createSlice({
  name: "agent-details",
  initialState,
  reducers: {
    updateAgentDetails: (state, action) => {
      state = { ...action.payload };
      state.agentId = action.payload.userId;
      state.userID = action.payload.userId;
      state.mobileNumber = action.payload.mobileNumber;
      state.userEmail = action.payload.userEmail;
      state.authorizationToken = action.payload.authorizationToken;
      state.impersonated = {};
      console.log("📝 Agent details updated", state, action);
      return state;
    },
    updateAgentId: (state, action) => {
      state.secondaryAgentId = action.payload;
      return state;
    },
    updateModuleId: (state, action) => {
      state = { ...state };
      state.moduleId = action.payload;
      return state;
    },

    deleteAgentDetails: (state) => {
      state = { ...initialState };
      return state;
    },
    verifyUser: (state, action) => {
      state = { ...state };
      state.isVerified = action.payload.isVerified;
      return state;
    },
    resetImpersonate: (state, action) => {
      state = { ...state };
      state.impersonated = {};
      return state;
    },

    setImpersonateUser: (state, action) => {
      state = { ...state };
      const firstUser = JSON.parse(JSON.stringify(state));
      state = { ...action.payload };
      state.agentId = action.payload.userId;
      state.userID = action.payload.userId;
      state.userId = action.payload.userId;
      state.roleId = action.payload.roleId;
      state.mobileNumber = action.payload.mobileNumber;
      state.userEmail = action.payload.userEmail;
      state.userName = action.payload.userName;
      state.level = action.payload.level;
      state.authorizationToken = action.payload.authorizationToken;
      state.impersonated = firstUser;
      return state;
    },
  },
});

// Action creators are generated for each case reducer function
export const {
  updateAgentDetails,
  deleteAgentDetails,
  updateAgentId,
  updateModuleId,
  verifyUser,
  setImpersonateUser,
  resetImpersonate,
} = agentDetailsSlice.actions;

export default agentDetailsSlice.reducer;
