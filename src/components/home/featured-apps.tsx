import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getApps } from "@/lib/actions/apps";

// Fallback placeholder apps when no promoted apps exist yet
const placeholderApps = [
  {
    name: "RateMyProfessor GraphQL API",
    description: "The RateMyProfessor GraphQL API allows users to search for professors, view their ratings, and access detailed reviews from the RateMyProfessors platform. It provides information such as overall quality, difficulty level, and student feedback.",
    appType: "api",
    image: "data:image/png;base64,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",
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

export async function FeaturedApps() {
  // Fetch all apps
  const result = await getApps();
  const apps = Array.isArray(result.apps) ? result.apps : [];
  
  // Filter for promoted apps
  const promotedApps = apps.filter(app => app.isPromoted);
  
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
          {displayApps.map((app, index) => (
            <Card key={index} className="overflow-hidden flex flex-col h-full">
              <div className="h-40 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
                {app.isPromoted && (
                  <div className="absolute top-2 right-2 bg-amber-400 text-amber-950 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Featured
                  </div>
                )}
                
                {app.iconUrl ? (
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <Image
                      src={app.iconUrl}
                      alt={app.name}
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
                  <Badge variant="outline" className="capitalize">{app.appType}</Badge>
                </div>
                <h3 className="font-semibold text-xl mt-2">{app.name}</h3>
                <p className="text-muted-foreground text-sm mt-1 flex-1">
                  {app.description?.substring(0, 120)}
                  {app.description?.length > 120 ? '...' : ''}
                </p>
                <div className="mt-4">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/apps/${app._id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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