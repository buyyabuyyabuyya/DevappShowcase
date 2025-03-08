import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { App } from "@/models/App";
import connectDB from "@/lib/db";

export async function GET() {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const apps = await App?.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json(apps);
  } catch (error) {
    console.error('Error fetching user apps:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 