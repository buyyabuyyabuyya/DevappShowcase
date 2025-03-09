import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UpgradeButton } from "@/components/shared/upgrade-button";
import { ProBadge } from "@/components/shared/pro-badge";

export function DashboardHeader({
  heading,
  text,
  children,
  isPro = false,
}: {
  heading: string;
  text?: string;
  children?: React.ReactNode;
  isPro?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 md:gap-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{heading}</h1>
          {isPro && <ProBadge />}
          {text && <p className="text-muted-foreground">{text}</p>}
        </div>
        <div className="flex items-center gap-2">
          {!isPro && <UpgradeButton variant="outline" />}
          <Button asChild>
            <Link href="/dashboard/list-app">Add New App</Link>
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
} 