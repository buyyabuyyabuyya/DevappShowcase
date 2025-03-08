"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppCard } from "@/components/apps/app-card";
import { PlusCircle } from "lucide-react";

export function AppList() {
  const [apps, setApps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadApps() {
      try {
        const response = await fetch('/api/apps/user');
        const data = await response.json();
        setApps(data);
      } catch (error) {
        console.error('Failed to load apps:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadApps();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Your Applications</h2>
        <Button asChild>
          <Link href="/dashboard/list-app">
            <PlusCircle className="mr-2 h-4 w-4" />
            List New App
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p>Loading your apps...</p>
        ) : apps.length === 0 ? (
          <p>No applications listed yet.</p>
        ) : (
          apps.map((app: any) => <AppCard key={app._id} app={app} />)
        )}
      </div>
    </div>
  );
} 