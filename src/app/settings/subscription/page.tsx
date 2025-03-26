"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useProStatus } from '@/context/pro-status-provider';
import Link from 'next/link';
import { PRO_SUBSCRIPTION } from '@/lib/constants';

export default function SubscriptionPage() {
  const { isPro, isLoading, subscriptionExpiresAt, refreshProStatus } = useProStatus();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        await refreshProStatus();
      } catch (error) {
        console.error('Failed to load subscription data:', error);
      } finally {
        setIsInitialLoad(false);
      }
    };

    loadData();
  }, [refreshProStatus]);

  if (isInitialLoad || isLoading) {
    return (
      <div className="container max-w-2xl py-10">
        <div className="flex justify-center items-center h-32">
          <p className="text-muted-foreground">Loading subscription details...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-2xl py-10">
      <h1 className="text-3xl font-bold mb-6">Subscription Management</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Current Plan</CardTitle>
          <CardDescription>Manage your subscription details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium">
                {isPro ? (
                  <span className="text-green-600">Active Pro Subscription</span>
                ) : (
                  <span>Free Plan</span>
                )}
              </span>
            </div>
            
            {isPro && subscriptionExpiresAt ? (
              <>
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Next billing date</h3>
                  <p className="text-lg font-medium">
                    {subscriptionExpiresAt instanceof Date 
                      ? new Intl.DateTimeFormat('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        }).format(subscriptionExpiresAt)
                      : typeof subscriptionExpiresAt === 'string' && subscriptionExpiresAt
                        ? new Intl.DateTimeFormat('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          }).format(new Date(subscriptionExpiresAt))
                        : 'Invalid Date'}
                  </p>
                </div>
              </>
            ) : null}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {isPro ? (
            <div className="space-x-4">
              <Button asChild variant="outline">
                <Link href={PRO_SUBSCRIPTION.CUSTOMER_PORTAL} target="_blank" rel="noopener noreferrer">
                  Manage Billing
                </Link>
              </Button>
            </div>
          ) : (
            <Button asChild>
              <Link href={PRO_SUBSCRIPTION.STRIPE_URL} target="_blank" rel="noopener noreferrer">
                Upgrade to Pro (${PRO_SUBSCRIPTION.PRICE}/{PRO_SUBSCRIPTION.INTERVAL})
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <h2 className="text-xl font-semibold mb-4">Plan Comparison</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Free Plan</CardTitle>
            <CardDescription>Basic features for everyone</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>• List up to 3 apps</li>
              <li>• Basic app details</li>
              <li>• Limited description length</li>
            </ul>
          </CardContent>
          <CardFooter>
            <div className="text-2xl font-bold">$0</div>
          </CardFooter>
        </Card>
        
        <Card className={isPro ? "border-2 border-primary" : ""}>
          <CardHeader className="bg-muted/50">
            <CardTitle>Pro Plan</CardTitle>
            <CardDescription>Monthly subscription with premium features</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>• Unlimited app listings</li>
              <li>• Extended description length</li>
              <li>• Featured placement options</li>
              <li>• Priority support</li>
            </ul>
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <div className="text-2xl font-bold">${PRO_SUBSCRIPTION.PRICE}/{PRO_SUBSCRIPTION.INTERVAL}</div>
            {!isPro && (
              <Button asChild>
                <Link href={PRO_SUBSCRIPTION.STRIPE_URL} target="_blank" rel="noopener noreferrer">
                  Upgrade
                </Link>
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 