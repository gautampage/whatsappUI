"use client";
import { useEffect } from "react";
import React from "react";
import { redirectToSSO } from "../../lib/auth";

export default function LoginPage() {
  useEffect(() => {
    redirectToSSO(); // Redirect to SSO provider with return URL
  }, []);
  return <div>Redirecting to login...</div>;
}
