import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserStatus } from "@/lib/actions/users";

export async function GET() {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ isPro: false });
  }

  try {
    const status = await getUserStatus();
    return NextResponse.json(status); 
  } catch (error) {
    return NextResponse.json({ isPro: false }, { status: 500 });
  }
} 

