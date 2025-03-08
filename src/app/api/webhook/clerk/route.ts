import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createUser, updateUser, deleteUser } from '@/lib/actions/users';

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

  // Handle different webhook events
  try {
    switch (evt.type) {
      case 'user.created':
        const { id, email_addresses, ...attributes } = evt.data;
        await createUser({
          clerkId: id,
          email: email_addresses[0]?.email_address,
          ...attributes
        });
        break;

      case 'user.updated':
        await updateUser(evt.data.id, {
          email: evt.data.email_addresses[0]?.email_address,
          ...evt.data
        });
        break;

      case 'user.deleted':
        await deleteUser(evt.data.id || '');
        break;

      case 'session.created':
        // Log session creation or handle as needed
        console.log('New session created:', evt.data.id);
        break;

      case 'session.ended':
        // Log session end or handle as needed
        console.log('Session ended:', evt.data.id);
        break;

      case 'organization.created':
        // Handle organization creation
        console.log('Organization created:', evt.data);
        break;

      default:
        console.log('Unhandled webhook event type:', evt.type);
    }

    return new Response('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Webhook processing failed', { status: 500 });
  }
} 