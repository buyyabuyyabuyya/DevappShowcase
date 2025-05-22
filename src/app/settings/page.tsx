import { auth } from "@clerk/nextjs/server";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserProfile } from "@/lib/firestore/users";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const session = await auth();
  const user = await currentUser();
  const userProfile = await getUserProfile();
  
  if (!session?.userId) {
    redirect("https://accounts.devappshowcase.com/sign-in");
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
          <SettingsClient userProfile={userProfile} />
        </CardContent>
      </Card>
    </main>
  );
} 