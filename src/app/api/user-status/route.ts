import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserProfile } from "@/lib/actions/users";

export async function GET() {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ isPro: false });
  }

  try {
    // This will create the user if they don't exist
    const { success, user, error } = await getUserProfile();
    
    if (!success || !user) {
      throw new Error(error || "Failed to get user profile");
    }
    
    return NextResponse.json({
      isPro: user.isPro
    });
  } catch (error) {
    console.error('Error fetching user status:', error);
    return NextResponse.json(
      { error: "Failed to fetch user status" },
      { status: 500 }
    );
  }
} 