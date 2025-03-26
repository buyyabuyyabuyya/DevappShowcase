import Stripe from 'stripe';

// Use the latest Stripe API version
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16', // Updated to the required version
}); 