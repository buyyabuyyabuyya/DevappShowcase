import Link from "next/link";
import { Button } from "@/components/ui/button";

const STRIPE_URL = "https://buy.stripe.com/8wMcOu43kcAFaxqcMN";

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
        <div>
          <h1 className="text-2xl font-bold">{heading}</h1>
          {text && <p className="text-muted-foreground">{text}</p>}
        </div>
        <div className="flex items-center gap-2">
          {!isPro && (
            <Button variant="outline" asChild>
              <Link href={STRIPE_URL}>Upgrade to Pro</Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/dashboard/list-app">Add New App</Link>
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
} 