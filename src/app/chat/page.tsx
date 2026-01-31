"use client";
import { useSelector } from "react-redux";
import ChatWindow from "../../components/chatwindow";
import { WelcomeScreen } from "./welcome";

export default function ChatPage() {
  const activeChatId = useSelector(
    (state: any) => state.chatSlice.activeChatId
  );
  const activeUser = useSelector((state: any) => state.chatSlice.chatUser);

  if (!activeUser) {
    return <WelcomeScreen />;
  }
  return <ChatWindow selectedUser={activeUser} />;
}
