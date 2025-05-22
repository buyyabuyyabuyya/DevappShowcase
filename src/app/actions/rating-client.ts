'use client';

// Client-side actions that call the server-side rating functions
// These avoid importing Clerk server components directly in client code

import { rateApp as serverRateApp, provideFeedback as serverProvideFeedback } from "./rating";

// Client-friendly versions of the server actions
export function rateApp({
  appId,
  type,
  rating
}: {
  appId: string;
  type: 'idea' | 'product';
  rating: number;
}) {
  return serverRateApp({ appId, type, rating });
}

export function provideFeedback({ 
  appId, 
  comment 
}: { 
  appId: string; 
  comment: string 
}) {
  return serverProvideFeedback({ appId, comment });
}
