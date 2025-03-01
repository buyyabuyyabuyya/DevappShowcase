import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserProfile, getUserStatus } from "@/lib/actions/users";

export async function GET() {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ isPro: false });
  }

  try {
    const status = await getUserStatus();
    return Response.json(status); 
  } catch (error) {
    return Response.json({ isPro: false }, { status: 500 });
  }
} 