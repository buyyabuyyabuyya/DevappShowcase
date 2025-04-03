import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-background shadow-md",
            headerTitle: "text-foreground",
            headerSubtitle: "text-muted-foreground",
          }
        }}
        afterSignUpUrl="/dashboard"
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
      />
    </div>
  );
} 