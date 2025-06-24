import { createSlice } from "@reduxjs/toolkit";

export const modalsSlice = createSlice({
  name: "modal",
  initialState: {
    isLoginModalOpen: false,
    isSidebarMenuVisible: false,
    isClaimStatusModalOpen: false,
  },
  reducers: {
    setIsLoginModalOpen: (state, action) => {
      state.isLoginModalOpen = action.payload;
    },
    setIsSidebarMenuVisible: (state, action) => {
      state.isSidebarMenuVisible = action.payload;
    },
    setIsClaimStatusModalOpen: (state, action) => {
      state.isClaimStatusModalOpen = action.payload;
    },
  },
});

export const {
  setIsLoginModalOpen,
  setIsSidebarMenuVisible,
  setIsClaimStatusModalOpen,
} = modalsSlice.actions;

export default modalsSlice.reducer;
