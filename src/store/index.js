import { configureStore } from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from "redux-persist";
import { encryptTransform } from "redux-persist-transform-encrypt";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";
import rootReducer from "./store";

// Create a noop storage for SSR
const createNoopStorage = () => {
  return {
    getItem(_key) {
      return Promise.resolve(null);
    },
    setItem(_key, value) {
      return Promise.resolve(value);
    },
    removeItem(_key) {
      return Promise.resolve();
    },
  };
};

// Use sessionStorage only on client side
const storage =
  typeof window !== "undefined"
    ? createWebStorage("session")
    : createNoopStorage();

const persistConfig = {
  key: "root",
  storage: storage,
  transforms: [
    encryptTransform({
      secretKey: process.env.NEXT_PUBLIC_REDUX_HYDRATE_KEY,
      onError: function (error) {
        // DOCS: Clearing the state on encryption error
        console.error("[INFO] Error in encryptTransform redux store: ", error);
        console.error("[INFO] Cleaning Old State ...");
        if (typeof window !== "undefined") {
          sessionStorage.clear();
          window.location.reload();
        }
      },
    }),
  ],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  devTools: process.env.NODE_ENV !== "production",
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

const persistor = persistStore(store);

export { persistor, store };
