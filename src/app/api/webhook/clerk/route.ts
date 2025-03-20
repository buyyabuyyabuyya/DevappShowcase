import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createUser, updateUser, deleteUser } from '@/lib/firestore/users';

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.WEBHOOK_SECRET || '');

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
  console.log(`Webhook received: ${eventType}`);

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
    console.log('User created:', response);
    
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
    console.log('User updated:', response);
    
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
    console.log('User deleted:', response);
    
    if (!response.success) {
      return new Response('Error deleting user', { status: 500 });
    }
  }

  return new Response('Webhook processed successfully', { status: 200 });
} 