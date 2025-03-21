"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@clerk/nextjs";
import { toast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { provideFeedback } from "@/app/actions/provide-feedback";

interface FeedbackSectionProps {
  appId: string;
  initialFeedback: Array<{
    userId: string;
    userName: string;
    userImageUrl?: string;
    comment: string;
    createdAt: string;
  }>;
}

export function FeedbackSection({ appId, initialFeedback }: FeedbackSectionProps) {
  const { userId, isSignedIn } = useAuth();
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(initialFeedback);

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    
    setIsSubmitting(true);
    try {
      const result = await provideFeedback({ 
        appId: appId,
        comment: comment
      });
      
      if (result.success && result.feedbackEntry) {
        setFeedback(prev => [
          {
            userId: result.feedbackEntry?.userId || '',
            userName: result.feedbackEntry?.userName || 'Anonymous',
            userImageUrl: result.feedbackEntry?.userImage || '',
            comment: result.feedbackEntry?.comment || '',
            createdAt: result.feedbackEntry?.createdAt || new Date().toISOString()
          },
          ...prev
        ]);
        setComment("");
        toast({
          title: "Success", 
          description: "Your feedback has been submitted",
        });
      } else {
        throw new Error(result.error || "An error occurred");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Feedback ({feedback.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isSignedIn ? (
          <div className="space-y-4">
            <Textarea
              placeholder="Share your thoughts about this app..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px]"
            />
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !comment.trim()}
              className="ml-auto block"
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        ) : (
          <div className="text-center py-4 bg-muted/30 rounded-lg">
            <p>Sign in to leave feedback</p>
          </div>
        )}

        {feedback.length > 0 ? (
          <div className="space-y-6 mt-6">
            {feedback.map((item, index) => (
              <div key={index} className="flex gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={item.userImageUrl} alt={item.userName} />
                  <AvatarFallback>
                    {item.userName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{item.userName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.comment}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No feedback yet. Be the first to share your thoughts!
          </div>
        )}
      </CardContent>
    </Card>
  );
} 