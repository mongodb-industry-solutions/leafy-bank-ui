"use client";

import React from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header/Header";

// Disable SSR for the entire LedgerFlow tree — R3F/three needs window,
// LG Drawer mounts portals at runtime, and the heavy LG component
// network resolves cleanly only after hydration.
const LedgerFlow = dynamic(() => import("@/components/LedgerFlow/LedgerFlow"), { ssr: false });

export default function LedgerFlowPage() {
  const handleLogout = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("user");
    localStorage.removeItem("accounts");
    localStorage.removeItem("transactions");
    localStorage.removeItem("external_accounts");
    localStorage.removeItem("external_products");
    localStorage.removeItem("connected_external_accounts");
    localStorage.removeItem("connected_external_products");
    localStorage.removeItem("selectedUser");
    window.location.href = "/";
  };

  return (
    <>
      <Header onLogout={handleLogout} />
      <LedgerFlow />
    </>
  );
}
