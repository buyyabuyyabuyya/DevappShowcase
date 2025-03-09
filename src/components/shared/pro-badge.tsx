"use client";

import { useProStatus } from "@/context/pro-status-provider";
import { Sparkles } from "lucide-react";

export function ProBadge({ className = "" }: { className?: string }) {
  const { isPro } = useProStatus();
  
  if (!isPro) return null;
  
  return (
    <div className={`flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-2 py-1 rounded-md text-xs font-medium ${className}`}>
      <Sparkles className="h-3 w-3" />
      Pro Mode
    </div>
  );
} 