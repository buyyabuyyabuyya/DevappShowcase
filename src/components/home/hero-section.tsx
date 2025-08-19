import { HeroSectionClient } from "./hero-section-client";

// Use the same Stripe URL defined elsewhere in your app
const STRIPE_URL = "https://buy.stripe.com/28o29Q2Zg1W19tmcMO";

export async function HeroSection() {
  // Render client-only hero; authentication and pro status are handled on the client.
  return <HeroSectionClient initialIsPro={false} />;
} 