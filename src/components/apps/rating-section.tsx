"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { rateApp, provideFeedback } from "@/lib/actions/ratings";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface RatingSectionProps {
  appId: string;
  ratings: {
    idea: { total: number; count: number; average: number };
    product: { total: number; count: number; average: number };
    feedback: { count: number };
  };
  onRatingChange?: (type: 'idea' | 'product', rating: number) => Promise<void>;
}

export function RatingSection({ appId, ratings: initialRatings, onRatingChange }: RatingSectionProps) {
  const [isRating, setIsRating] = useState(false);
  const [ratings, setRatings] = useState(initialRatings);
  const [userRatings, setUserRatings] = useState<{
    idea: number | null;
    product: number | null;
  }>({ idea: null, product: null });
  const [hoverRating, setHoverRating] = useState<{
    idea: number | null;
    product: number | null;
  }>({ idea: null, product: null });

  async function handleRate(type: 'idea' | 'product', rating: number) {
    try {
      // Prevent rating if it's the same as current user rating
      if (userRatings[type] === rating) {
        toast({
          title: "Cannot reselect rating",
          description: "Please choose a different rating value",
          variant: "destructive"
        });
        return;
      }

      setIsRating(true);
      
      // Call the parent's onRatingChange if provided
      if (onRatingChange) {
        await onRatingChange(type, rating);
      }

      // Optimistic update
      const oldRating = userRatings[type];
      setUserRatings(prev => ({ ...prev, [type]: rating }));
      
      setRatings(prev => {
        const currentTotal = prev[type].total;
        const newTotal = oldRating 
          ? currentTotal - oldRating + rating 
          : currentTotal + rating;
        const newCount = oldRating 
          ? prev[type].count 
          : prev[type].count + 1;
        const newAverage = newTotal / newCount;
        
        return {
          ...prev,
          [type]: {
            ...prev[type],
            count: newCount,
            total: newTotal,
            average: newAverage
          }
        };
      });

      const result = await rateApp({ appId, type, rating });
      
      if (result.success) {
        toast({
          title: "Rating updated",
          description: "Thank you for your feedback!"
        });
      }
    } catch (error: any) {
      // Revert optimistic updates
      setUserRatings(prev => ({ ...prev, [type]: null }));
      setRatings(initialRatings);
      
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating",
        variant: "destructive"
      });
    } finally {
      setIsRating(false);
    }
  }

  async function handleFeedback() {
    try {
      setIsRating(true);
      
      // Optimistic update
      setRatings(prev => ({
        ...prev,
        feedback: {
          count: prev.feedback.count + 1
        }
      }));

      await provideFeedback({ appId, comment: "" });
                            
      toast({
        title: "Feedback recorded", 
        description: "Thank you for your feedback!"
      });
    } catch (error) {
      // Revert optimistic update on error
      setRatings(initialRatings);
      toast({
        title: "Error",
        description: "Failed to record feedback",
        variant: "destructive"
      });
    } finally {
      setIsRating(false);
    }
  }

  function getRatingColor(rating: number) {
    if (rating >= 4) return "text-yellow-500 fill-yellow-500";
    if (rating >= 3) return "text-green-500 fill-green-500";
    if (rating >= 2) return "text-orange-500 fill-orange-500";
    return "text-red-500 fill-red-500";
  }

  function getStarColor(type: 'idea' | 'product', starPosition: number) {
    const hoverValue = hoverRating[type];
    const actualRating = Math.round(ratings[type].average);
    
    if (hoverValue !== null) {
      return starPosition <= hoverValue
        ? getRatingColor(hoverValue)
        : "text-gray-300";
    }
    
    return starPosition <= actualRating
      ? getRatingColor(actualRating)
      : "text-gray-300";
  }

  function getDisplayAverage(type: 'idea' | 'product') {
    const rating = ratings[type];
    if (!rating || !rating.count) return 0;
    return Number((rating.total / rating.count).toFixed(1));
  }

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg">
      <h3 className="text-lg font-semibold">Ratings</h3>
      <div className="space-y-3">
        {/* Idea Rating */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Idea</span>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={`idea-${star}`}
                  size={20}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:scale-110",
                    getStarColor('idea', star),
                    isRating && "pointer-events-none opacity-70",
                    userRatings.idea === star && "cursor-not-allowed opacity-50"
                  )}
                  onMouseEnter={() => setHoverRating(prev => ({ ...prev, idea: star }))}
                  onMouseLeave={() => setHoverRating(prev => ({ ...prev, idea: null }))}
                  onClick={() => !isRating && star !== userRatings.idea && handleRate("idea", star)}
                  fill={
                    hoverRating.idea !== null
                      ? star <= hoverRating.idea
                        ? "currentColor"
                        : "none"
                      : star <= Math.round(ratings.idea.average)
                      ? "currentColor"
                      : "none"
                  }
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {getDisplayAverage('idea')}
            </span>
          </div>
        </div>

        {/* Product Rating */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Product</span>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={`product-${star}`}
                  size={20}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:scale-110",
                    getStarColor('product', star),
                    isRating && "pointer-events-none opacity-70",
                    userRatings.product === star && "cursor-not-allowed opacity-50"
                  )}
                  onMouseEnter={() => setHoverRating(prev => ({ ...prev, product: star }))}
                  onMouseLeave={() => setHoverRating(prev => ({ ...prev, product: null }))}
                  onClick={() => !isRating && star !== userRatings.product && handleRate("product", star)}
                  fill={
                    hoverRating.product !== null
                      ? star <= hoverRating.product
                        ? "currentColor"
                        : "none"
                      : star <= Math.round(ratings.product.average)
                      ? "currentColor"
                      : "none"
                  }
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {getDisplayAverage('product')}
            </span>
          </div>
        </div>

        {/* Feedback */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Feedback</span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${(ratings.feedback.count / 100) * 100}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {ratings.feedback.count}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 