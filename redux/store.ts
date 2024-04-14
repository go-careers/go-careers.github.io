import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { apiSlice } from "./features/apiSlice";
import filterReducer from "./features/slices/filters/JobFilterSlices";

const store = configureStore({
  reducer: {
    // Add other reducers here if needed
    [apiSlice.reducerPath]: apiSlice.reducer,
    filters: filterReducer,
    // advanceSearch: advanceSearchReducer,
  },

  devTools: process.env.NODE_ENV !== "production",
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

setupListeners(store.dispatch);
