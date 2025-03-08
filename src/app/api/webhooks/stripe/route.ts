import { NextRequest, NextResponse } from "next/server";
import { Stripe } from "stripe";
import { handleProSubscription, promoteAllUserApps } from "@/lib/actions/users";
import { User } from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    const signature = req.headers.get("stripe-signature") as string;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(text, signature, webhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle specific events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        
        if (userId) {
          await handleProSubscription({ 
            userId, 
            status: 'active' 
          });
        }
        break;
      }
      
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        
        if (userId) {
          const status = subscription.status === "active" ? "active" : "canceled";
          await handleProSubscription({ userId, status });
        }
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        
        if (userId) {
          await handleProSubscription({ userId, status: "canceled" });
        }
        break;
      }
    }

    // After setting user.isPro = true
    if (event.type === 'checkout.session.completed' || 
        event.type === 'payment_intent.succeeded') {
      
      // Find user by checkout session metadata or payment intent metadata
      let userId;
      
      if (event.type === 'checkout.session.completed') {
        // Extract user ID from checkout session metadata
        userId = event.data.object.metadata?.userId;
      } else {
        // Extract user ID from payment intent metadata
        const paymentIntent = event.data.object;
        // You might need to retrieve the session to get metadata
        const session = await stripe.checkout.sessions.retrieve(
          paymentIntent.metadata?.checkout_session_id
        );
        userId = session.metadata?.userId;
      }
      
      if (userId) {
        // Find user by Clerk ID
        const user = await User.findOne({ clerkId: userId });
        
        if (user) {
          // Update user to Pro
          user.isPro = true;
          await user.save();
          
          // Promote all user's apps
          await promoteAllUserApps(user._id.toString());
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 