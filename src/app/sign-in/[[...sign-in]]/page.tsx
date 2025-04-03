import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-background shadow-md",
            headerTitle: "text-foreground",
            headerSubtitle: "text-muted-foreground",
          }
        }}
        afterSignInUrl="/dashboard"
        routing="path"
        path="/sign-in"
        signUpUrl="https://accounts.devappshowcase.com/sign-up"
      />
    </div>
  );
} 