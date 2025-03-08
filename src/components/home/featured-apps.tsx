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
    name: "TaskForge",
    description: "AI-powered task management for developers",
    appType: "website",
    image: "/images/placeholder-app1.png",
    isPromoted: true
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
                
                {app.imageUrl ? (
                  <Image 
                    src={app.imageUrl} 
                    alt={app.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <Code className="h-16 w-16" />
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