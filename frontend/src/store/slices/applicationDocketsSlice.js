import { createSlice } from "@reduxjs/toolkit";

const applicationDocketsSlice = createSlice({
  name: "applicationDockets",
  initialState: {
    showDocket: {},
    showApplication: {},
  },
  reducers: {
    setShowApplication: (state, action) => {
      const { applicationId, showTab } = action.payload;
      state.showApplication = {
        [applicationId]: {
          showTab,
        },
      };
    },
    setShowDocket: (state, action) => {
      const { docketId, showTab } = action.payload;
      state.showDocket = {
        [docketId]: {
          showTab,
        },
      };
    },
    clearShowState: (state) => {
      state.showApplication = {};
      state.showDocket = {};
    },
    clearDocketState: (state) => {
      state.showDocket = {};
    },
  },
});

export const {
  setShowDocket,
  clearShowState,
  clearDocketState,
  setShowApplication,
} = applicationDocketsSlice.actions;
export default applicationDocketsSlice.reducer;
