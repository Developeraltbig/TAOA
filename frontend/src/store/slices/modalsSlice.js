import { createSlice } from "@reduxjs/toolkit";

export const modalsSlice = createSlice({
  name: "modal",
  initialState: {
    isLoginModalOpen: false,
    resetPasswordToken: null,
    isSidebarMenuVisible: false,
    isClaimStatusModalOpen: false,
    isForgotPasswordModalOpen: false,
  },
  reducers: {
    setIsLoginModalOpen: (state, action) => {
      state.isLoginModalOpen = action.payload;
    },
    setResetPasswordToken: (state, action) => {
      state.resetPasswordToken = action.payload;
    },
    setIsSidebarMenuVisible: (state, action) => {
      state.isSidebarMenuVisible = action.payload;
    },
    setIsClaimStatusModalOpen: (state, action) => {
      state.isClaimStatusModalOpen = action.payload;
    },
    setIsForgotPasswordModalOpen: (state, action) => {
      state.isForgotPasswordModalOpen = action.payload;
    },
  },
});

export const {
  setIsLoginModalOpen,
  setResetPasswordToken,
  setIsSidebarMenuVisible,
  setIsClaimStatusModalOpen,
  setIsForgotPasswordModalOpen,
} = modalsSlice.actions;

export default modalsSlice.reducer;
