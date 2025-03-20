// Note: NO runtime = 'edge' here - this is a Node.js API route

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserProfile } from '@/lib/firestore/users';
import { DocumentData } from 'firebase/firestore';

interface UserResult {
  success: boolean;
  user?: DocumentData;
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.userId) {
      return NextResponse.json(
        { isPro: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const result = await getUserProfile() as UserResult;
    
    if (!result || !result.success) {
      return NextResponse.json(
        { isPro: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // At this point we know result.success is true and result.user exists
    const userData = result.user as DocumentData;

    return NextResponse.json({
      isPro: !!userData?.isPro,
      subscriptionExpiresAt: userData?.subscriptionExpiresAt || null
    });
  } catch (error) {
    console.error('Error fetching user status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 