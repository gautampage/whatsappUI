"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to chat/agent portal by default
    router.push("/chat?token=sample_token_123&agentId=12&roleId=13");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-600">Redirecting to Agent Portal...</div>
    </div>
  );
}
