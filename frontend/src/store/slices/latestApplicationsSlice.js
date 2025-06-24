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
  },
});

export const { setLatestApplication } = latestApplicationsSlice.actions;
export default latestApplicationsSlice.reducer;
