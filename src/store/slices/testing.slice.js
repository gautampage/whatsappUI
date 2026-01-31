import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  settlement: null,
};

export const testingSlice = createSlice({
  name: "testing-details",
  initialState,
  reducers: {
    setSettlementData: (state) => {
      state.settlement = 0;
      return state;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setSettlementData } = testingSlice.actions;

export default testingSlice.reducer;
