"use client";

import { MotionConfig } from "motion/react";
import { ToastProvider } from "@/components/ui";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    // Respect the OS "reduce motion" setting for every animation.
    <MotionConfig reducedMotion="user">
      <ToastProvider>{children}</ToastProvider>
    </MotionConfig>
  );
}
