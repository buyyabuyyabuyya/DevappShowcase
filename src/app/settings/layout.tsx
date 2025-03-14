"use client";

import { ProStatusProvider } from "@/context/pro-status-provider";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProStatusProvider>
      {children}
    </ProStatusProvider>
  );
} 