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

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
  width: 'device-width',
  initialScale: 1,
};

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

export default function RootLayout({
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
        <body suppressHydrationWarning className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AppHeader />
            {children}
          </ThemeProvider>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}