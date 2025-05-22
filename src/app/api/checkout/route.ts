import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/firestore/users";
import { stripe } from "@/lib/stripe";

// Define the price ID for your Pro subscription
const PRO_PRICE_ID = "prod_RwJKcifWtNr3nc"; // Replace with your actual Stripe price ID

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
      success_url: `${request.headers.get("origin")}/settings?success=true`,
      cancel_url: `${request.headers.get("origin")}/settings?canceled=true`,
      metadata: {
        clerkId: userId,
      },
      customer_email: userEmail,
      // If the user already has a Stripe customer ID, use it
      customer: userResult.user.stripeCustomerId || undefined,
    });
    
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
} 