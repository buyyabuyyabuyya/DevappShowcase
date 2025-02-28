import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ProFeatures } from "@/components/settings/pro-features";
import { getUserProfile } from "@/lib/actions/users";

export default async function SettingsPage() {
  const { userId } = auth();
  const user = await currentUser();
  const userProfile = await getUserProfile();
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account settings and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <h3 className="font-medium">Email</h3>
              <p className="text-sm text-muted-foreground">{user?.emailAddresses[0]?.emailAddress}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <h3 className="font-medium">Name</h3>
              <p className="text-sm text-muted-foreground">{user?.firstName} {user?.lastName}</p>
            </div>
          </div>
          <div className="border-t pt-4 mt-4">
            <Button variant="destructive" asChild>
              <Link href="/sign-out">Sign Out</Link>
            </Button>
          </div>
          <CardContent className="space-y-4">
            <ProFeatures isPro={userProfile?.user?.isPro} />
          </CardContent>
        </CardContent>
      </Card>
    </main>
  );
} 