export const appTypes = [
  { value: "website", label: "Website" },
  { value: "mobile", label: "Mobile App" },
  { value: "desktop", label: "Desktop Application" },
  { value: "extension", label: "Browser Extension" },
  { value: "api", label: "API" },
  { value: "ai", label: "AI" }
] as const;

export const categories = [
  { value: "productivity", label: "Productivity" },
  { value: "education", label: "Education" },
  { value: "entertainment", label: "Entertainment" },
  { value: "social", label: "Social" },
  { value: "developer-tools", label: "Developer Tools" },
] as const;

export const pricingTypes = [
  { label: "Free", value: "free", description: "This product is free to use" },
  { label: "Paid", value: "paid", description: "This product requires payment and there is no free option" },
  { label: "Freemium", value: "freemium", description: "This product requires payment but also offers a free trial or version" }
] as const;

export const APP_LIMITS = {
  FREE_USER: {
    MAX_APPS: 3,
    DESCRIPTION_MAX_LENGTH: 500
  },
  PRO_USER: {
    MAX_APPS: Infinity,
    DESCRIPTION_MAX_LENGTH: 2000
  }
};

export const PRO_SUBSCRIPTION = {
  PRICE: 5.99,
  INTERVAL: 'month',
  STRIPE_URL: "https://buy.stripe.com/28o29Q2Zg1W19tmcMO",
  CUSTOMER_PORTAL: "https://billing.stripe.com/p/login/28o29Q2Zg1W19tmcMO"
}; 