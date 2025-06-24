import { createSlice } from "@reduxjs/toolkit";

const defaultApplicationDocumentState = {
  subjectClaimsFailed: false,
  subjectClaimsUploaded: false,
  isSubjectClaimsUploading: false,
  subjectDescriptionFailed: false,
  priorArtDescriptionFailed: false,
  subjectDescriptionFetched: false,
  priorArtDescriptionFetched: false,
  isSubjectDescriptionFetching: false,
  isPriorArtDescriptionFetching: false,
  showApplicationDocumentsLoading: false,
};

const defaultapplicationRejectionState = {
  isTechnicalComparisonLoading: false,
  isTechnicalComparisonClaimsAmended: false,
  isNovelFeaturesLoading: false,
  isNovelFeaturesClaimsAmended: false,
  isDependentClaimsLoading: false,
  isDependentClaimsAmended: false,
  isCompositeAmendmentLoading: false,
  isCompositeAmendmentClaimsAmended: false,
  isOneFeaturesLoading: false,
  isOneFeaturesClaimsAmended: false,
};

const authUserSlice = createSlice({
  name: "authUser",
  initialState: {
    authUser: null,
    docketId: null,
    applicationId: null,
    applicationDocuments: {},
    applicationRejections: {},
  },
  reducers: {
    setAuthUser: (state, action) => {
      state.authUser = action.payload;
    },
    setDocketId: (state, action) => {
      state.docketId = action.payload;
    },
    setApplicationId: (state, action) => {
      state.applicationId = action.payload;
    },
    setApplicationDocuments: (state, action) => {
      const { applicationId, showApplicationDocumentsLoading: isDocsLoading } =
        action.payload;
      if (!state.applicationDocuments[applicationId]) {
        state.applicationDocuments[applicationId] = {
          ...defaultApplicationDocumentState,
        };
      }
      state.applicationDocuments[
        applicationId
      ].showApplicationDocumentsLoading = isDocsLoading;
    },
    setApplicationRejections: (state, action) => {
      const { rejectionId, name, value } = action.payload;
      if (!state.applicationRejections[rejectionId]) {
        state.applicationRejections[rejectionId] = {
          ...defaultapplicationRejectionState,
        };
      }
      state.applicationRejections[rejectionId][name] = value;
    },
    setPriorArt: (state, action) => {
      const { applicationId, name, value } = action.payload;
      if (!state.applicationDocuments[applicationId]) {
        state.applicationDocuments[applicationId] = {
          ...defaultApplicationDocumentState,
        };
      }
      state.applicationDocuments[applicationId][name] = value;
    },
    setSubjectClaims: (state, action) => {
      const { applicationId, name, value } = action.payload;
      if (!state.applicationDocuments[applicationId]) {
        state.applicationDocuments[applicationId] = {
          ...defaultApplicationDocumentState,
        };
      }
      state.applicationDocuments[applicationId][name] = value;
    },
    setSubjectDescription: (state, action) => {
      const { applicationId, name, value } = action.payload;
      if (!state.applicationDocuments[applicationId]) {
        state.applicationDocuments[applicationId] = {
          ...defaultApplicationDocumentState,
        };
      }
      state.applicationDocuments[applicationId][name] = value;
    },
    clearUserSlice: (state) => {
      state.authUser = null;
      state.docketId = null;
      state.applicationId = null;
      state.applicationDocuments = {};
      state.applicationRejections = {};
    },
  },
});

export const {
  setAuthUser,
  setDocketId,
  setPriorArt,
  clearUserSlice,
  setSubjectClaims,
  setApplicationId,
  setSubjectDescription,
  setApplicationDocuments,
  setApplicationRejections,
} = authUserSlice.actions;
export default authUserSlice.reducer;
