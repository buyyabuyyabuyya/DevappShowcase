import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { AppHeader } from "@/components/shared/app-header";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import './globals.css'
import Script from "next/script";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
// Import for server-side only
import { headers } from 'next/headers';
/*
 Environment validation in development only
if (process.env.NODE_ENV === 'development') {
  // Dynamic import to avoid bundling with client code
  import('@/lib/env-validator').then(({ validateEnvVariables }) => {
    validateEnvVariables();
  }).catch((err) => {
    console.error('Failed to load environment validator:', err);
  });
}
*/
const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};
//to pus to vercel and make it static
export const metadata: Metadata = {
  title: "DevApp Showcase",
  description: "Showcase your developer applications and projects",
  icons: {
    icon: [
      { url: '/web-development-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/web-development-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/web-development-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  // These settings help with SEO and browser caching
  metadataBase: new URL('https://devappshowcase.com'),
  alternates: {
    canonical: '/',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DevApp Showcase',
  },
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth();
  const userId = session?.userId || null;

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests; default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://*.clerk.accounts.dev https://*.clerk.com; connect-src 'self' https://* wss://*; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-src 'self' https://* https://pagead2.googlesyndication.com;" />
          <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6382423704016281"
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        </head>
        <body suppressHydrationWarning className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AppHeader />
            {children}
            <Analytics />
          </ThemeProvider>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}