import { createSlice } from "@reduxjs/toolkit";

const draftSlice = createSlice({
  name: "draft",
  initialState: {
    error: null,
    flag: false,
    isGenerating: false,
    generatedDraft: null,
    finalizationStatus: {},
  },
  reducers: {
    setIsGenerating: (state, action) => {
      state.isGenerating = action.payload;
    },
    setFlag: (state) => {
      state.flag = !state.flag;
    },
    setGeneratedDraft: (state, action) => {
      state.generatedDraft = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    updateFinalizationStatus: (state, action) => {
      const { applicationId, rejectionStatuses } = action.payload;

      const allFinalized = Object.values(rejectionStatuses).every(
        (status) => status.isFinalized
      );

      state.finalizationStatus[applicationId] = {
        allFinalized,
        rejections: rejectionStatuses,
      };
    },
    clearDraft: (state) => {
      state.generatedDraft = null;
      state.error = null;
    },
  },
});

export const {
  setFlag,
  setError,
  clearDraft,
  setIsGenerating,
  setGeneratedDraft,
  updateFinalizationStatus,
} = draftSlice.actions;

export default draftSlice.reducer;
