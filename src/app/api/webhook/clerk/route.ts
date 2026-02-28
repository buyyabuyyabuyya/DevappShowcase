import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createUser, updateUser, deleteUser } from '@/lib/firestore/users';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    return new Response('Webhook secret not configured', { status: 500 });
  }

  // Get the headers
  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  // Verify raw body for signature safety.
  const body = await req.text();

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(secret);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error verifying webhook', { status: 400 });
  }

  // Handle the webhook event
  const eventType = evt.type;
  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    
    const userData = {
      clerkId: id,
      email: email_addresses[0]?.email_address,
      first_name,
      last_name,
      image_url
    };

    const response = await createUser(userData);
    
    if (!response.success) {
      return new Response('Error creating user', { status: 500 });
    }
  }

  if (eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    
    const userData = {
      email: email_addresses[0]?.email_address,
      first_name,
      last_name,
      image_url
    };

    const response = await updateUser(id, userData);
    
    if (!response.success) {
      return new Response('Error updating user', { status: 500 });
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;
    
    if (!id) {
      return new Response('User ID is required', { status: 400 });
    }
    
    const response = await deleteUser(id);
    
    if (!response.success) {
      return new Response('Error deleting user', { status: 500 });
    }
  }

  return new Response('Webhook processed successfully', { status: 200 });
} 
