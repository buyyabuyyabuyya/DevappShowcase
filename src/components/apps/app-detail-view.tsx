"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ExternalLink, 
  Github, 
  Youtube, 
  Edit2, 
  Trash2, 
  Star,
  ChevronLeft,
  ChevronRight,
  Heart
} from "lucide-react";
import { deleteApp } from "@/app/actions/delete-app";
import { togglePromoteApp } from "@/app/actions/toggle-promote-app";
import { rateApp } from "@/app/actions/rating";
import { likeApp } from "@/app/actions/like-app";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RatingSection } from "./rating-section";
import { FeedbackSection } from "./feedback-section";
import { PromotionCard } from "./promotion-card";
import { doc, updateDoc, increment, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface AppDetailViewProps {
  app: any;
  isOwner: boolean;
  isProUser: boolean;
}

export function AppDetailView({ app, isOwner, isProUser }: AppDetailViewProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(app.likes?.count || 0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const hasImages = app.imageUrls && app.imageUrls.length > 0;
  
  const nextImage = () => {
    if (hasImages) {
      setCurrentImageIndex((prev) => 
        prev === app.imageUrls.length - 1 ? 0 : prev + 1
      );
    }
  };
  
  const prevImage = () => {
    if (hasImages) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? app.imageUrls.length - 1 : prev - 1
      );
    }
  };

  async function handleDelete() {
    try {
      const result = await deleteApp(app.id);
      if (!result.success) {
        throw new Error(result.error || "An error occurred");
      }
      toast({
        title: "Success",
        description: "App deleted successfully",
      });
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete app",
        variant: "destructive",
      });
    }
  }

  async function handleLike() {
    try {
      const result = await likeApp(app.id);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      setIsLiked(result.isLiked || false);
      setLikeCount(result.count);
      
      toast({
        title: "Success",
        description: result.isLiked ? "You've liked this app" : "You've unliked this app",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to like app",
      });
    }
  }

  async function handlePromote() {
    try {
      const result = await togglePromoteApp(app.id);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      app.isPromoted = !app.isPromoted;
      
      toast({
        title: "Success",
        description: app.isPromoted
          ? "App promoted successfully"
          : "App removed from promotion",
      });
      
      router.refresh();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update promotion status",
      });
    }
  }

  const handleRatingChange = async (type: 'idea' | 'product', rating: number) => {
    try {
      const result = await rateApp({
        appId: app.id,
        type: type,
        rating: rating
      });
      if (!result.success) {
        throw new Error(result.error ?? "Unknown error");
      }

      toast({
        title: "Rating submitted",
        description: "Thank you for your feedback!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit rating",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {app.iconUrl ? (
            <Image
              src={app.iconUrl}
              alt={app.name}
              width={80}
              height={80}
              className="rounded-lg object-contain"
            />
          ) : (
            <div className="w-20 h-20 bg-muted rounded-lg" />
          )}
          <div>
            <h1 className="text-3xl font-bold">{app.name}</h1>
            <div className="flex gap-2 mt-2">
              <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                {app.appType}
              </span>
              <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                {app.category}
              </span>
            </div>
          </div>
        </div>
        
        {isOwner && (
          <div className="flex gap-2">
            {isProUser && (
              <Button 
                variant="outline" 
                onClick={handlePromote}
                className={app.isPromoted ? "bg-yellow-100" : ""}
              >
                <Star className={`w-4 h-4 mr-2 ${app.isPromoted ? "text-yellow-500 fill-yellow-500" : ""}`} />
                {app.isPromoted ? "Promoted" : "Promote"}
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href={`/apps/${app.id}/edit`}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your application.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="whitespace-pre-wrap">{app.description}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {app.liveUrl && (
          <Button variant="outline" className="justify-start" asChild>
            <a href={app.liveUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Visit Live Demo
            </a>
          </Button>
        )}
        
        {app.repoUrl && (
          <Button variant="outline" className="justify-start" asChild>
            <a href={app.repoUrl} target="_blank" rel="noopener noreferrer">
              <Github className="w-4 h-4 mr-2" />
              View Source Code
            </a>
          </Button>
        )}
        
        {app.youtubeUrl && (
          <Button variant="outline" className="justify-start" asChild>
            <a href={app.youtubeUrl} target="_blank" rel="noopener noreferrer">
              <Youtube className="w-4 h-4 mr-2" />
              Watch Demo Video
            </a>
          </Button>
        )}
        
        <Button 
          variant="outline" 
          className={`justify-start ${isLiked ? "bg-red-50" : ""}`}
          onClick={handleLike}
        >
          <Heart className={`w-4 h-4 mr-2 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
          Like ({likeCount})
        </Button>
      </div>

      {/* Screenshots Section - Now above Ratings */}
      {hasImages && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Screenshots</h2>
          <div className="relative w-full rounded-lg overflow-hidden">
            <div className="aspect-video w-full relative">
              <Image
                src={app.imageUrls[currentImageIndex]}
                alt={`Screenshot ${currentImageIndex + 1}`}
                fill
                className="object-contain bg-black/20"
              />
            </div>
            
            {app.imageUrls.length > 1 && (
              <>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 hover:bg-background"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 hover:bg-background"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {app.imageUrls.map((_: any, index: number) => (
                    <div 
                      key={index} 
                      className={`w-2 h-2 rounded-full ${
                        index === currentImageIndex ? 'bg-primary' : 'bg-muted'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {app.appType === 'api' && (
        <Card>
          <CardHeader>
            <CardTitle>API Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {app.apiEndpoint && (
              <div>
                <h3 className="font-medium">Base URL</h3>
                <code className="block bg-muted p-2 rounded mt-1">
                  {app.apiEndpoint}
                </code>
              </div>
            )}
            {app.apiDocs && (
              <Button variant="outline" className="w-full" asChild>
                <a href={app.apiDocs} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View API Documentation
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ratings Section - Now below Screenshots */}
      <RatingSection 
        appId={app.id}
        ratings={app.ratings}
        onRatingChange={handleRatingChange}
      />
      
      {/* Feedback Section */}
      <FeedbackSection 
        appId={app.id}
        initialFeedback={app.feedback || []}
      />

      {/* Only show promotion card to the app owner */}
      {isOwner && (
        <PromotionCard 
          appId={app.id}
          isProUser={isProUser}
          isAppPromoted={app.isPromoted}
        />
      )}
    </div>
  );
} 