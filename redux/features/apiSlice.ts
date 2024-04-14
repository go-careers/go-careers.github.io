import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
  reducerPath: "api",
  tagTypes: [
    /* endpoints provided tags will be added here */
  ],
  baseQuery: fetchBaseQuery({
    baseUrl: "https://4d07kxo8oa.execute-api.ap-south-1.amazonaws.com",
  }),
  endpoints: () => ({}), // Endpoints will be injected here
});

// Export the hook that will be used to inject endpoints in another file
export const { injectEndpoints } = apiSlice;
