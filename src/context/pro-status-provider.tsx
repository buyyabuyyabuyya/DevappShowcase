"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useCallback } from "react";

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
  const [hasFetched, setHasFetched] = useState(false);

  const refreshProStatus = useCallback(async () => {
    if (hasFetched) return; // Prevent multiple fetches
    
    try {
      setIsLoading(true);
      console.log("Fetching user status...");
      
      const response = await fetch('/api/user-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });
      
      if (!response.ok) {
        console.error('Failed to fetch user status:', response.status);
        throw new Error('Failed to fetch user status');
      }
      
      const data = await response.json();
      console.log("User status data:", data);
      
      setIsPro(!!data.isPro);
      
      // Handle Firestore timestamp format
      if (data.subscriptionExpiresAt) {
        if (typeof data.subscriptionExpiresAt === 'string') {
          // Handle string timestamp
          setSubscriptionExpiresAt(new Date(data.subscriptionExpiresAt));
        } else if (data.subscriptionExpiresAt.seconds) {
          // Handle Firestore timestamp format {seconds: number, nanoseconds: number}
          setSubscriptionExpiresAt(new Date(data.subscriptionExpiresAt.seconds * 1000));
        } else {
          // Handle normal date object
          setSubscriptionExpiresAt(new Date(data.subscriptionExpiresAt));
        }
      } else {
        setSubscriptionExpiresAt(null);
      }
    } catch (error) {
      console.error('Failed to refresh PRO status:', error);
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  }, [hasFetched]);

  useEffect(() => {
    refreshProStatus();
  }, [refreshProStatus]);

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
