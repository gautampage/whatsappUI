import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLazyGetMessagesQuery } from "../store/slices/chatAPI";
import { setMessagesSlice } from "../store/slices/chatSlice";
import axios from "axios";

export function useChatPoller(userId: any) {
  const activeChatId = useSelector(
    (state: any) => state.chatSlice.activeChatId
  );
  const [trigger] = useLazyGetMessagesQuery();
  const dispatch = useDispatch();
  const lastMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeChatId) return;
    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          "https://jsonplaceholder.typicode.com/posts",
          {
            params: { postId: activeChatId },
          }
        );

        const messages = response.data || [];
        const lastId = messages[messages.length - 1]?.id;

        if (lastId !== lastMessageIdRef.current) {
          lastMessageIdRef.current = lastId;
          dispatch(setMessagesSlice(messages));
        }
      } catch (error) {
        console.error("Error polling messages:", error);
      }
    };

    fetchMessages(); // initial
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [activeChatId, trigger, dispatch, userId]);
}
