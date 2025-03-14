import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserProfile } from '@/lib/actions/users';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.userId) {
      return NextResponse.json(
        { isPro: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const user = await getUserProfile();
    
    if (!user || !user.success) {
      return NextResponse.json(
        { isPro: false, message: 'User not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({
      isPro: !!(user.user?.isPro),
      subscriptionExpiresAt: user.user?.subscriptionExpiresAt || null
    });
  } catch (error) {
    console.error('Error fetching user status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 

