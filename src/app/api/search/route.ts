import { NextRequest, NextResponse } from "next/server";
import { searchApps } from "@/lib/firestore/apps";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const rawQuery = request.nextUrl.searchParams.get("q") || "";
    const searchTerm = rawQuery.trim().slice(0, 64);
    if (/[\u0000-\u001F]/.test(searchTerm)) {
      return NextResponse.json({ results: [] }, { status: 400 });
    }

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
