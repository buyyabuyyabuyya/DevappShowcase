import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/firestore/users";
import { stripe } from "@/lib/stripe";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Define the price ID for your Pro subscription
const PRO_PRICE_ID = "prod_RwJKcifWtNr3nc"; // Replace with your actual Stripe price ID

function resolveAppBaseUrl(request: NextRequest) {
  const configuredBaseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  if (!host) {
    throw new Error("Missing host header");
  }
  return `${proto}://${host}`;
}

function isTrustedOrigin(request: NextRequest, baseUrl: string) {
  const origin = request.headers.get("origin");
  if (!origin) return true; // Allow non-browser clients.

  try {
    const originUrl = new URL(origin);
    const base = new URL(baseUrl);
    return originUrl.host === base.host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const authSession = await auth();

    if (!authSession?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = authSession.userId;
    const appBaseUrl = resolveAppBaseUrl(request);

    if (!isTrustedOrigin(request, appBaseUrl)) {
      return NextResponse.json(
        { error: "Untrusted origin" },
        { status: 403 }
      );
    }

    // Get user data to include in metadata
    const userResult = await getUserByClerkId(userId);

    if (!userResult.success || !userResult.user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Get the user's email
    const userEmail = userResult.user.email;
    
    if (!userEmail) {
      return NextResponse.json(
        { error: "User has no email address" },
        { status: 400 }
      );
    }
    
    // Create checkout session with metadata and email
    const checkoutSession = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${appBaseUrl}/settings?success=true`,
      cancel_url: `${appBaseUrl}/settings?canceled=true`,
      metadata: {
        clerkId: userId,
      },
      customer_email: userEmail,
      // If the user already has a Stripe customer ID, use it
      customer: userResult.user.stripeCustomerId || undefined,
    });
    
    return NextResponse.json(
      { url: checkoutSession.url },
      {
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
} 
