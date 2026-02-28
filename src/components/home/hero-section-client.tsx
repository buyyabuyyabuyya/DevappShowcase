"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

// Use the same Stripe URL defined elsewhere in your app
const STRIPE_URL = "https://buy.stripe.com/28o29Q2Zg1W19tmcMO";

export function HeroSectionClient({ initialIsPro = false }) {
  const { isSignedIn, user } = useUser();
  const [isPro, setIsPro] = useState(initialIsPro);
  const [statusLoaded, setStatusLoaded] = useState(false);
  
  useEffect(() => {
    let cancelled = false;

    async function loadProStatus() {
      if (!isSignedIn) {
        if (!cancelled) {
          setIsPro(false);
          setStatusLoaded(true);
        }
        return;
      }

      try {
        const response = await fetch('/api/user-status', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });

        if (!response.ok) {
          if (!cancelled) setStatusLoaded(true);
          return;
        }

        const data = await response.json();
        if (!cancelled) {
          setIsPro(!!data.isPro);
          setStatusLoaded(true);
        }
      } catch (error) {
        if (!cancelled) {
          setStatusLoaded(true);
        }
      }
    }

    loadProStatus();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, user?.id]);
  
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
              Discover and Showcase <br/>
              Amazing Developer Apps
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
              Explore innovative applications created by talented developers or showcase your own creations to a community of tech enthusiasts.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/apps">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Explore Apps
              </Button>
            </Link>
            {isSignedIn ? (
              <>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline">
                    My Dashboard
                  </Button>
                </Link>
                {statusLoaded && !isPro && (
                  <Link href={STRIPE_URL} target="_blank">
                    <Button size="lg" variant="outline" className="bg-gradient-to-r from-pink-500 to-yellow-500 text-white border-none hover:from-pink-600 hover:to-yellow-600">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Upgrade to Pro
                    </Button>
                  </Link>
                )}
              </>
            ) : (
              <Link href="https://accounts.devappshowcase.com/sign-in">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
