import { NextRequest, NextResponse } from "next/server";
import { searchApps } from "@/lib/firestore/apps";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchTerm = request.nextUrl.searchParams.get("q") || "";
    const results = await searchApps(searchTerm, 5);

    return NextResponse.json(
      { results },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
