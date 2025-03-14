import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserProfile } from '@/lib/actions/users';

export async function GET(request: NextRequest) {
  try {
    console.log("User status API called");
    const session = await auth();
    console.log("Auth session:", session?.userId);
    
    if (!session?.userId) {
      console.log("No user ID found in session");
      return NextResponse.json(
        { isPro: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const user = await getUserProfile();
    console.log("User profile response:", user);
    
    if (!user || !user.success) {
      console.log("Failed to get user profile");
      return NextResponse.json(
        { isPro: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const response = {
      isPro: !!(user.user?.isPro),
      subscriptionExpiresAt: user.user?.subscriptionExpiresAt || null
    };
    console.log("Sending response:", response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 

