import { APP_LIMITS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function ProFeatures({ isPro }: { isPro: boolean }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Your Plan: {isPro ? 'Pro' : 'Free'}</h3>
      <div className="space-y-2">
        <p>
          Apps Limit: {isPro ? '∞' : APP_LIMITS.FREE_USER.MAX_APPS}
        </p>
        <p>
          Description Length: {isPro ? APP_LIMITS.PRO_USER.DESCRIPTION_MAX_LENGTH : APP_LIMITS.FREE_USER.DESCRIPTION_MAX_LENGTH} characters
        </p>
      </div>
      {!isPro && (
        <Button asChild>
          <Link href="/settings/upgrade">Upgrade to Pro</Link>
        </Button>
      )}
    </div>
  );
} 