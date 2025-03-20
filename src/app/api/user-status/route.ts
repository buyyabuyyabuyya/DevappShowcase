import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId } from '@/lib/firestore/users';

export async function GET(request: NextRequest) {
  try {
    console.log("User status API called");
    const session = await auth();
    console.log("Auth session:", session?.userId);
    
    if (!session?.userId) {
      console.log("No user ID found in session");
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
    console.log("User profile response:", user);
    
    if (!user.success) {
      console.log("Failed to get user profile");
      return NextResponse.json(
        { isPro: false, message: 'User not found' },
        { 
          status: 404,
          headers: {
            'Cache-Control': 'no-store'
          }
        }
      );
    }

    const response = {
      isPro: user.user?.isPro ?? false,
      subscriptionExpiresAt: user.user?.subscriptionExpiresAt ?? null
    };
    console.log("Sending response:", response);
    
    // For authenticated user data, allow short-term caching (30 seconds)
    // but require revalidation for fresh data
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, max-age=30, must-revalidate'
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

