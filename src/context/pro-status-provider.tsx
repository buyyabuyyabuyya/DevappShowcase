"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface ProStatusContextType {
  isPro: boolean;
  isLoading: boolean;
  refreshProStatus: () => Promise<void>;
  subscriptionExpiresAt: Date | null;
}

const ProStatusContext = createContext<ProStatusContextType>({
  isPro: false,
  isLoading: true,
  refreshProStatus: async () => {},
  subscriptionExpiresAt: null,
});

export function ProStatusProvider({ 
  children,
  initialIsPro = false 
}: { 
  children: React.ReactNode;
  initialIsPro?: boolean;
}) {
  const [isPro, setIsPro] = useState(initialIsPro);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<Date | null>(null);

  const refreshProStatus = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching user status...");
      const response = await fetch('/api/user-status');
      
      if (!response.ok) {
        throw new Error('Failed to fetch user status');
      }
      
      const data = await response.json();
      console.log("User status data:", data);
      
      setIsPro(!!data.isPro);
      
      if (data.subscriptionExpiresAt) {
        setSubscriptionExpiresAt(new Date(data.subscriptionExpiresAt));
      } else {
        setSubscriptionExpiresAt(null);
      }
    } catch (error) {
      console.error('Failed to refresh PRO status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProStatus();
    
    // Check subscription status every hour
    const intervalId = setInterval(refreshProStatus, 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <ProStatusContext.Provider 
      value={{ 
        isPro, 
        isLoading, 
        refreshProStatus,
        subscriptionExpiresAt 
      }}
    >
      {children}
    </ProStatusContext.Provider>
  );
}

export const useProStatus = () => useContext(ProStatusContext); 