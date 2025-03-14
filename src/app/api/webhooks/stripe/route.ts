import { NextRequest, NextResponse } from "next/server";
import { Stripe } from "stripe";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { handleProSubscription, promoteAllUserApps, updateUserSubscriptionStatus } from "@/lib/actions/users";
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature') as string;
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }
    
    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
        { status: 400 }
      );
    }
    
    // Handle subscription events
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          // Handle one-time payment to subscription transition if needed
          if (session.subscription && session.customer) {
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
            await updateUserSubscriptionStatus({
              stripeCustomerId: session.customer as string,
              isActive: subscription.status === 'active',
              subscriptionId: subscription.id,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            });
          }
          break;
        }
        
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          const status = subscription.status;
          const isActive = status === 'active' || status === 'trialing';
          
          await updateUserSubscriptionStatus({
            stripeCustomerId: customerId,
            isActive,
            subscriptionId: subscription.id,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          });
          break;
        }
          
        case 'customer.subscription.deleted': {
          const canceledSubscription = event.data.object as Stripe.Subscription;
          const canceledCustomerId = canceledSubscription.customer as string;
          
          await updateUserSubscriptionStatus({
            stripeCustomerId: canceledCustomerId,
            isActive: false,
            subscriptionId: null,
            currentPeriodEnd: null,
          });
          break;
        }
      }
      
      return NextResponse.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook event:', error);
      return NextResponse.json(
        { error: 'Error processing webhook event' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 