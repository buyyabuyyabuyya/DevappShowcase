"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getUserStatus } from "@/lib/actions/users";

interface ProStatusContextType {
  isPro: boolean;
  checkProStatus: () => Promise<void>;
  loading: boolean;
}

const defaultContext: ProStatusContextType = {
  isPro: false,
  checkProStatus: async () => {},
  loading: false
};

const ProStatusContext = createContext<ProStatusContextType>(defaultContext);

export const useProStatus = () => useContext(ProStatusContext);

export function ProStatusProvider({ 
  children,
  initialIsPro = false
}: { 
  children: ReactNode;
  initialIsPro?: boolean;
}) {
  const [isPro, setIsPro] = useState(initialIsPro);
  const [loading, setLoading] = useState(false);

  const checkProStatus = async () => {
    setLoading(true);
    try {
      const result = await getUserStatus();
      if (result.success) {
        setIsPro(result.isPro);
      }
    } catch (error) {
      console.error("Failed to check Pro status:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check status when returning from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      checkProStatus();
      
      // Clean URL without refreshing
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      window.history.replaceState({}, document.title, url.toString());
    }
  }, []);

  return (
    <ProStatusContext.Provider value={{ isPro, checkProStatus, loading }}>
      {children}
    </ProStatusContext.Provider>
  );
} 