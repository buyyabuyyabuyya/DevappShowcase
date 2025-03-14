import { NextRequest, NextResponse } from "next/server";
import { Stripe } from "stripe";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { handleProSubscription, promoteAllUserApps, updateUserSubscriptionStatus } from "@/lib/actions/users";
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get("stripe-signature");

    console.log("Webhook received with signature:", signature);

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature || "",
        webhookSecret
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    console.log("Processing webhook event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout session completed:", {
          customerEmail: session.customer_details?.email,
          customerId: session.customer,
          subscriptionId: session.subscription,
        });

        if (!session.customer || !session.subscription) {
          console.error("Missing customer or subscription ID");
          return NextResponse.json(
            { error: "Missing customer or subscription ID" },
            { status: 400 }
          );
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        console.log("Subscription details:", {
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        });

        await connectDB();
        const result = await updateUserSubscriptionStatus({
          stripeCustomerId: session.customer as string,
          isActive: subscription.status === "active",
          subscriptionId: subscription.id,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        });

        console.log("Update result:", result);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription updated:", {
          customerId: subscription.customer,
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        });

        await connectDB();
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

        await connectDB();
        const result = await updateUserSubscriptionStatus({
          stripeCustomerId: subscription.customer as string,
          isActive: false,
          subscriptionId: null,
          currentPeriodEnd: null,
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