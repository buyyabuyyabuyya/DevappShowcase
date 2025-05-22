"use client";

import { useEffect } from "react";
import { useProStatus } from "@/context/pro-status-provider";
import { ProFeatures } from "@/components/settings/pro-features";
import { toast } from "@/components/ui/use-toast";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CardContent } from "@/components/ui/card";

interface SettingsClientProps {
  userProfile: any; // Update this type according to your actual data structure
}

export function SettingsClient({ userProfile }: SettingsClientProps) {
  const { refreshProStatus, isPro } = useProStatus();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");
  
  useEffect(() => {
    // Show toast and check status when returning from Stripe
    if (success === "true") {
      toast({
        title: "Success!",
        description: "Your payment was successful. Welcome to Pro!",
      });
      refreshProStatus();
    }
    
    if (canceled === "true") {
      toast({
        title: "Payment canceled",
        description: "You can upgrade to Pro anytime.",
        variant: "destructive",
      });
    }
  }, [success, canceled, refreshProStatus]);

  return (
    <>
      <div className="border-t pt-4 mt-4">
        <Button variant="destructive" asChild>
          <Link href="/sign-out">Sign Out</Link>
        </Button>
      </div>
      <CardContent className="space-y-4">
        <ProFeatures />
      </CardContent>
    </>
  );
}
