import { getApps } from "@/lib/firestore/apps";
import { AppGrid } from "@/components/apps/app-grid";
import { AppFilters } from "@/components/apps/app-filters";

interface AppsPageProps {
  searchParams: {
    type?: string;
    featured?: string;
    category?: string;
    search?: string;
  };
}

export default async function AppsPage({ searchParams }: AppsPageProps) {
  const { type, featured, category, search } = searchParams;
  
  // Get all apps
  const response = await getApps();
  const apps = response.success ? response.apps || [] : [];
  
  // Filter apps based on URL parameters
  let filteredApps = [...apps] as any[];
  
  if (type) {
    filteredApps = filteredApps.filter(app => app.appType === type);
  }
  
  if (featured === 'true') {
    filteredApps = filteredApps.filter(app => app.isPromoted);
  }
  
  if (category) {
    filteredApps = filteredApps.filter(app => app.category === category);
  }
  
  if (search) {
    const searchLower = search.toLowerCase();
    filteredApps = filteredApps.filter(app => 
      app.name.toLowerCase().includes(searchLower) || 
      app.description.toLowerCase().includes(searchLower)
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {featured === 'true' ? 'Featured Apps' : 'All Apps'}
        {type && ` - ${type.charAt(0).toUpperCase() + type.slice(1)}`}
      </h1>
      
      <AppFilters />
      
      <AppGrid apps={filteredApps} />
    </div>
  );
} 