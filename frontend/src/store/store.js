import draftReducer from "./slices/draftSlice";
import storage from "redux-persist/lib/storage";
import modalsReducer from "./slices/modalsSlice";
import loadingReducer from "./slices/loadingSlice";
import authUserReducer from "./slices/authUserSlice";
import { persistStore, persistReducer } from "redux-persist";
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import latestApplicationsReducer from "./slices/latestApplicationsSlice";
import applicationsDocketsReducer from "./slices/applicationDocketsSlice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["user"],
};

const rootReducer = combineReducers({
  draft: draftReducer,
  modals: modalsReducer,
  user: authUserReducer,
  loading: loadingReducer,
  applications: latestApplicationsReducer,
  applicationDockets: applicationsDocketsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);
