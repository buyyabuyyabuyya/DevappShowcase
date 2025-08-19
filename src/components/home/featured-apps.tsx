import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getApps } from "@/lib/firestore/apps";

// Fallback placeholder apps when no promoted apps exist yet
const placeholderApps = [
  {
    name: "RateMyProfessor GraphQL API",
    description: "The RateMyProfessor GraphQL API allows users to search for professors, view their ratings, and access detailed reviews from the RateMyProfessors platform.",
    appType: "api",
    isPromoted: true,
    _id: "67cc24f797da00754dc17573"
  },
  {
    name: "CodeBuddy",
    description: "Pair programming assistant with real-time collaboration",
    appType: "desktop",
    image: "/images/placeholder-app2.png",
    isPromoted: true
  },
  {
    name: "DevTracker",
    description: "Monitor your coding time and productivity",
    appType: "mobile",
    image: "/images/placeholder-app3.png", 
    isPromoted: true
  }
];

export async function FeaturedApps({ initialApps = [] }: { initialApps?: any[] }) {
  // Use apps passed from the page when available to avoid duplicate fetching
  let apps = Array.isArray(initialApps) ? initialApps : [];

  if (apps.length === 0) {
    const result = await getApps({ isPromoted: true, limitCount: 6 });
    apps = result.success && Array.isArray(result.apps) ? result.apps : [];
  }
  
  // Filter for promoted apps - using type assertion to handle Firestore data
  const promotedApps = apps.filter(app => (app as any).isPromoted);
  
  // Use real promoted apps if available, otherwise fallback to placeholders
  const displayApps = promotedApps.length > 0 ? 
    promotedApps.slice(0, 6) : // Show at most 6 featured apps
    placeholderApps;

  return (
    <div className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-3xl font-bold">Featured Applications</h2>
          <p className="text-muted-foreground">Discover standout projects from our community</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayApps.map((app, index) => {
            // Safely access properties with type assertion
            const appData = app as any;
            return (
              <Card key={index} className="overflow-hidden flex flex-col h-full">
                <div className="h-40 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
                  {appData.isPromoted && (
                    <div className="absolute top-2 right-2 bg-amber-400 text-amber-950 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Featured
                    </div>
                  )}
                  
                  {appData.iconUrl ? (
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <Image
                        src={appData.iconUrl}
                        alt={appData.name}
                        width={100}
                        height={100}
                        className="object-contain max-h-32"
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white text-4xl">
                      &lt; &gt;
                    </div>
                  )}
                </div>
                <CardContent className="flex-1 flex flex-col pt-6">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize">{appData.appType}</Badge>
                  </div>
                  <h3 className="font-semibold text-xl mt-2">{appData.name}</h3>
                  <p className="text-muted-foreground text-sm mt-1 flex-1">
                    {appData.description?.substring(0, 120)}
                    {appData.description?.length > 120 ? '...' : ''}
                  </p>
                  <div className="mt-4">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/apps/${appData.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        
        <div className="mt-10 text-center">
          <Button asChild size="lg">
            <Link href="/apps">
              Browse All Applications
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 