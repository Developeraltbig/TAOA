import { createSlice } from "@reduxjs/toolkit";

const latestApplicationsSlice = createSlice({
  name: "applications",
  initialState: {
    latestApplication: [],
  },
  reducers: {
    setLatestApplication: (state, action) => {
      state.latestApplication = action.payload;
    },
    updateDocketData: (state, action) => {
      const { applicationId, docketId, name, value } = action.payload;
      const appIndex = state.latestApplication.findIndex(
        (app) => app.applicationId === applicationId
      );
      if (appIndex !== -1) {
        const docketIndex = state.latestApplication[appIndex].dockets.findIndex(
          (docket) => docket._id === docketId
        );
        if (docketIndex !== -1) {
          state.latestApplication[appIndex].dockets[docketIndex][name] = value;
        }
      }
    },
    addOrUpdateApplication: (state, action) => {
      const newApplication = action.payload;
      const existingIndex = state.latestApplication.findIndex(
        (data) => data._id === newApplication._id
      );

      if (existingIndex !== -1) {
        state.latestApplication.splice(existingIndex, 1);
      } else if (state.latestApplication.length === 3) {
        state.latestApplication.pop();
      }
      state.latestApplication.unshift(newApplication);
    },
  },
});

export const {
  updateDocketData,
  setLatestApplication,
  addOrUpdateApplication,
} = latestApplicationsSlice.actions;
export default latestApplicationsSlice.reducer;
