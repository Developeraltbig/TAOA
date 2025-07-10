import { createSlice } from "@reduxjs/toolkit";

const loadingSlice = createSlice({
  name: "loadingState",
  initialState: {
    isDocketsAnalysing: {},
    isUserLoggingIn: false,
    isUserSigningUp: false,
    isApiFinalizing: false,
    isUserLoggingOut: false,
    loadLatestApplications: false,
    isApplicationAnalysing: false,
    isApplicationUploading: false,
    isLatestApplicationLoading: false,
  },
  reducers: {
    clearIsDocketsAnalysing: (state) => {
      state.isDocketsAnalysing = {};
    },
    setIsUserSigningUp: (state, action) => {
      state.isUserSigningUp = action.payload;
    },
    setIsUserLoggingIn: (state, action) => {
      state.isUserLoggingIn = action.payload;
    },
    setIsApiFinalizing: (state, action) => {
      state.isApiFinalizing = action.payload;
    },
    setIsUserLoggingOut: (state, action) => {
      state.isUserLoggingOut = action.payload;
    },
    setIsDocketsAnalysing: (state, action) => {
      const { docketId, loading } = action.payload;
      state.isDocketsAnalysing = {
        [docketId]: {
          loading,
        },
      };
    },
    setIsApplicationAnalysing: (state, action) => {
      state.isApplicationAnalysing = action.payload;
    },
    setIsApplicationUploading: (state, action) => {
      state.isApplicationUploading = action.payload;
    },
    setLoadLatestApplications: (state, action) => {
      state.loadLatestApplications = action.payload;
    },
    setIsLatestApplicationLoading: (state, action) => {
      state.isLatestApplicationLoading = action.payload;
    },
  },
});

export const {
  setIsUserSigningUp,
  setIsUserLoggingIn,
  setIsApiFinalizing,
  setIsUserLoggingOut,
  setIsDocketsAnalysing,
  clearIsDocketsAnalysing,
  setLoadLatestApplications,
  setIsApplicationAnalysing,
  setIsApplicationUploading,
  setIsLatestApplicationLoading,
} = loadingSlice.actions;
export default loadingSlice.reducer;
