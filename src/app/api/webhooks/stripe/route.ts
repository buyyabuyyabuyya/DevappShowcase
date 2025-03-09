import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { handleProSubscription, promoteAllUserApps } from "@/lib/actions/users";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature") as string;
    
    if (!sig) {
      return NextResponse.json({ error: "No signature provided" }, { status: 400 });
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    console.log("Webhook event received:", event.type);
    
    // Handle checkout completion events
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log("Processing completed checkout:", session.id);
      
      // Extract user ID from session metadata or customer email
      let userId = session.metadata?.userId;
      const customerEmail = session.customer_details?.email;
      
      // If we have a userId in metadata, find user by Clerk ID
      if (userId) {
        await connectDB();
        const user = await User.findOne({ clerkId: userId });
        
        if (user) {
          console.log(`Upgrading user with ClerkID ${userId} to Pro`);
          user.isPro = true;
          await user.save();
          
          // Uncomment if promoteAllUserApps is needed
          // await promoteAllUserApps(user._id.toString());
        } else {
          console.log(`User with ClerkID ${userId} not found`);
        }
      } 
      // Fallback: Try to find user by email if no userId in metadata
      else if (customerEmail) {
        console.log(`Looking up user by email: ${customerEmail}`);
        await connectDB();
        const user = await User.findOne({ email: customerEmail });
        
        if (user) {
          console.log(`Found and upgrading user by email ${customerEmail}`);
          user.isPro = true;
          await user.save();
          
          // Uncomment if promoteAllUserApps is needed
          // await promoteAllUserApps(user._id.toString());
        } else {
          console.log(`No user found with email ${customerEmail}`);
        }
      } else {
        console.log("No user identification found in checkout data");
      }
    } 
    // Handle payment intent success events (SAFELY)
    else if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      console.log("Processing payment intent:", paymentIntent.id);
      
      // Only try to retrieve session if we actually have a session ID
      if (paymentIntent.metadata?.checkout_session_id) {
        try {
          const session = await stripe.checkout.sessions.retrieve(
            paymentIntent.metadata.checkout_session_id
          );
          
          let userId = session.metadata?.userId;
          
          if (userId) {
            await connectDB();
            const user = await User.findOne({ clerkId: userId });
            
            if (user) {
              console.log(`Upgrading user via payment intent to Pro`);
              user.isPro = true;
              await user.save();
              
              // Uncomment if promoteAllUserApps is needed
              // await promoteAllUserApps(user._id.toString());
            }
          }
        } catch (error) {
          console.error("Error retrieving checkout session:", error);
          // Continue processing - this shouldn't halt the webhook
        }
      } else {
        console.log("No checkout_session_id in payment intent metadata");
        // Try email-based lookup as a fallback
        const paymentIntentEmail = paymentIntent.receipt_email;
        
        if (paymentIntentEmail) {
          console.log(`Trying to find user by payment email: ${paymentIntentEmail}`);
          await connectDB();
          const user = await User.findOne({ email: paymentIntentEmail });
          
          if (user) {
            console.log(`Found and upgrading user by payment email`);
            user.isPro = true;
            await user.save();
            
            // Uncomment if promoteAllUserApps is needed
            // await promoteAllUserApps(user._id.toString());
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 