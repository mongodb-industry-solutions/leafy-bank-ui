"use client";

import React from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header/Header";

const LedgerFlowV3 = dynamic(
  () => import("@/components/LedgerFlowV3/LedgerFlowV3"),
  { ssr: false }
);

export default function LedgerFlowV3Page() {
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
      <LedgerFlowV3 />
    </>
  );
}
