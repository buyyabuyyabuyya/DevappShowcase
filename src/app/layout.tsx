import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import './globals.css'
import Script from "next/script";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = auth();

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7633648357076933"
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        </head>
        <body suppressHydrationWarning>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <header className="border-b">
              <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <Link href="/" className="font-semibold text-xl">
                  DevApp Showcase
                </Link>
                <div className="flex gap-4 items-center">
                  {!userId ? (
                    <>
                      <Button variant="outline" asChild>
                        <Link href="/sign-in">Sign In</Link>
                      </Button>
                      <Button asChild>
                        <Link href="/sign-up">Sign Up</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" asChild>
                        <Link href="/dashboard">Dashboard</Link>
                      </Button>
                      <Link href="/settings">
                        <UserButton afterSignOutUrl="/" />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </header>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}