import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId } from '@/lib/firestore/users';
import { clerkClient } from '@clerk/nextjs/server';
import { createUser } from '@/lib/firestore/users';

export const dynamic = 'force-dynamic';

function toDateValue(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value?.toDate === 'function') {
    const parsed = value.toDate();
    return parsed instanceof Date && !isNaN(parsed.getTime()) ? parsed : null;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.userId) {
      return NextResponse.json(
        { isPro: false, message: 'Unauthorized' },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store'
          }
        }
      );
    }
    
    const user = await getUserByClerkId(session.userId);
    
    if (!user.success) {
      try {
        // Get user data from Clerk
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(session.userId);
        
        if (!clerkUser) {
          throw new Error('User not found in Clerk');
        }
        
        // Create user in Firestore
        const userData = {
          clerkId: session.userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || null,
          first_name: clerkUser.firstName || null,
          last_name: clerkUser.lastName || null,
          image_url: clerkUser.imageUrl || null
        };
        
        const newUser = await createUser(userData);
        
        if (newUser.success) {
          return NextResponse.json({
            isPro: false,
            subscriptionExpiresAt: null
          }, {
            headers: {
              'Cache-Control': 'no-store'
            }
          });
        }
      } catch (createError) {
        console.error("Failed to create user:", createError);
      }
    }

    const expiryDate = toDateValue(user.user?.subscriptionExpiresAt);
    const isPro = !!user.user?.isPro || (!!expiryDate && expiryDate > new Date());
    const response = {
      isPro,
      subscriptionExpiresAt: expiryDate ? expiryDate.toISOString() : null
    };
    
    // For authenticated user data, allow short-term caching (30 seconds)
    // but require revalidation for fresh data
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Error fetching user status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  }
} 

