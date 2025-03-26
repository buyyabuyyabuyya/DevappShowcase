import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { updateUserSubscriptionStatus } from "@/lib/firestore/users";
import { headers } from 'next/headers';
import { getDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    if (!signature) {
      return NextResponse.json(
        { error: "Stripe signature missing" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret!
      );
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { error: `Webhook signature verification failed` },
        { status: 400 }
      );
    }

    console.log(`Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout session completed with full data:", JSON.stringify(session));
        console.log("Customer ID:", session.customer);
        console.log("Metadata:", session.metadata);
        
        // Get the clerk ID from the metadata
        const clerkId = session.metadata?.clerkId;
        
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          
          // If we have a clerkId in metadata, we should update the user directly
          if (clerkId) {
            // First, check if user exists
            const userDoc = await getDoc(doc(db, 'users', clerkId));
            
            if (userDoc.exists()) {
              // Update user document with Stripe info
              await updateDoc(doc(db, 'users', clerkId), {
                stripeCustomerId: session.customer as string,
                isPro: subscription.status === "active",
                subscriptionId: subscription.id,
                subscriptionExpiresAt: new Date(subscription.current_period_end * 1000),
                updatedAt: serverTimestamp()
              });
              
              console.log(`User updated directly via clerkId: ${clerkId}`);
              return NextResponse.json({ received: true });
            }
          }
          
          // Fall back to the existing logic if no clerkId or user not found
          const result = await updateUserSubscriptionStatus({
            stripeCustomerId: session.customer as string,
            isActive: subscription.status === "active",
            subscriptionId: subscription.id,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          });
          
          console.log("Subscription created:", result);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription updated:", {
          customerId: subscription.customer,
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        });

        const result = await updateUserSubscriptionStatus({
          stripeCustomerId: subscription.customer as string,
          isActive: subscription.status === "active",
          subscriptionId: subscription.id,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        });

        console.log("Update result:", result);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription deleted:", {
          customerId: subscription.customer,
          status: subscription.status,
        });

        const result = await updateUserSubscriptionStatus({
          stripeCustomerId: subscription.customer as string,
          isActive: false,
          subscriptionId: "",
          currentPeriodEnd: new Date(),
        });

        console.log("Update result:", result);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
} 