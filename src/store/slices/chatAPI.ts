import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const chatAPI = createApi({
  reducerPath: "chatAPI",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/messages" }),
  endpoints: (builder) => ({
    getMessages: builder.query({
      query: ({ from, to }) => `?from=${from}&to=${to}`,
    }),
    sendMessage: builder.mutation({
      query: (body) => ({
        url: "/send",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useSendMessageMutation, useLazyGetMessagesQuery } = chatAPI;
