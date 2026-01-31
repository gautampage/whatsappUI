import { useEffect, useRef } from "react";

export function useNewMessageTone(customers) {
  const previousUnreadCounts = useRef({});

  useEffect(() => {
    if (!Array.isArray(customers)) return;

    let playTone = false;

    customers.forEach((customer) => {
      const prevCount = previousUnreadCounts.current[customer.customerId] || 0;
      const newCount = customer.unreadMessageCount;

      // If count increased, play tone
      if (newCount > prevCount) {
        playTone = true;
      }

      // Store latest unread count
      previousUnreadCounts.current[customer.customerId] = newCount;
    });

    if (playTone) {
      const audio = new Audio("/sounds/web_whatsapp.mp3"); // put sound file in public folder
      console.log("im playing audio");
      audio.play().catch((error) => {
        console.error(error);
      }); // catch autoplay errors silently
    }
  }, [customers]);
}
export default useNewMessageTone;
