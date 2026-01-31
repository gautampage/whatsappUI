// components/Portal.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children: React.ReactNode;
}

export default function Portal({ children }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Avoid SSR mismatch error
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const portalRoot = document.getElementById("portal-root");
  return portalRoot ? createPortal(children, portalRoot) : null;
}
