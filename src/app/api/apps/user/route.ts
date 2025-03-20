import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserApps } from "@/lib/firestore/apps";

export async function GET() {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await getUserApps(userId);
    if (!response.success) {
      return NextResponse.json(
        { error: response.error }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json(response.apps);
  } catch (error) {
    console.error('Error fetching user apps:', error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
} 