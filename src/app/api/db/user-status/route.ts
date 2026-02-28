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
    
    const result = await getUserProfile() as UserResult;
    
    if (!result || !result.success) {
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

    // At this point we know result.success is true and result.user exists
    const userData = result.user as DocumentData;

    const expiryDate = toDateValue(userData?.subscriptionExpiresAt);
    return NextResponse.json(
      {
        isPro: !!userData?.isPro || (!!expiryDate && expiryDate > new Date()),
        subscriptionExpiresAt: expiryDate ? expiryDate.toISOString() : null
      },
      {
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
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

export const dynamic = 'force-dynamic'; 
