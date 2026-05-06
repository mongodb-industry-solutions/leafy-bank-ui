"use client";

import { useEffect } from "react";

// Bind Space / Enter / ArrowRight (and ArrowLeft, optional) to handlers.
// Skips events originating from form inputs so we don't steal text entry.
export function useStepperKeys({ onNext, onPrev, enabled = true, enabledPrev }) {
  const prevEnabled = enabledPrev !== undefined ? enabledPrev : enabled;
  useEffect(() => {
    const nextOn = enabled;
    const prevOn = prevEnabled;
    if (!nextOn && !prevOn) return undefined;
    const handler = (e) => {
      const target = e.target;
      const tag = target?.tagName?.toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;

      if (e.code === "Space" || e.code === "Enter" || e.code === "ArrowRight") {
        if (nextOn && onNext) { e.preventDefault(); onNext(); }
      } else if (e.code === "ArrowLeft") {
        if (prevOn && onPrev) { e.preventDefault(); onPrev(); }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onNext, onPrev, enabled, prevEnabled]);
}
