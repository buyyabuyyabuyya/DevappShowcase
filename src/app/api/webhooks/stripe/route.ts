import { NextResponse } from "next/server";
import { updateUserSubscriptionStatus } from "@/lib/firestore/users";
import { getDoc, doc, updateDoc, serverTimestamp, getDocs, query, collection, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { stripe } from "@/lib/stripe";

import {Stripe} from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    if (!webhookSecret) {
      return NextResponse.json(
        { error: "Stripe webhook secret not configured" },
        { status: 500 }
      );
    }

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

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          
          // Try to find the user by email first, since we know the email is set when the user signs up
          const customerEmail = session.customer_email;
          
          if (customerEmail) {
            // Find user by email
            const userSnapshot = await getDocs(
              query(collection(db, 'users'), where('email', '==', customerEmail))
            );
            
            if (!userSnapshot.empty) {
              // User found by email
              const userDoc = userSnapshot.docs[0];
              const userData = userDoc.data();
              
              // Update user with Stripe info
              await updateDoc(doc(db, 'users', userDoc.id), {
                stripeCustomerId: session.customer as string,
                isPro: subscription.status === "active",
                subscriptionId: subscription.id,
                subscriptionExpiresAt: new Date(subscription.current_period_end * 1000),
                updatedAt: serverTimestamp()
              });
              
              return NextResponse.json({ received: true });
            }
          }
          
          // Fall back to the metadata if available
          const clerkId = session.metadata?.clerkId;
          if (clerkId) {
            // Try to find user by Clerk ID
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
              
              return NextResponse.json({ received: true });
            }
          }
          
          // Last resort: try to find by Stripe customer ID (original approach)
          const result = await updateUserSubscriptionStatus({
            stripeCustomerId: session.customer as string,
            isActive: subscription.status === "active",
            subscriptionId: subscription.id,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          });
          
          if (!result.success) {
            console.error("Failed to sync checkout subscription event");
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        const result = await updateUserSubscriptionStatus({
          stripeCustomerId: subscription.customer as string,
          isActive: subscription.status === "active",
          subscriptionId: subscription.id,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        });

        if (!result.success) {
          console.error("Failed to sync subscription.updated event");
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        const result = await updateUserSubscriptionStatus({
          stripeCustomerId: subscription.customer as string,
          isActive: false,
          subscriptionId: "",
          currentPeriodEnd: new Date(),
        });

        if (!result.success) {
          console.error("Failed to sync subscription.deleted event");
        }
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
