"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@clerk/nextjs";
import { toast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { provideFeedback } from "@/app/actions/rating";
import Image from "next/image";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { editFeedbackAction, deleteFeedbackAction } from "@/app/actions/feedback-actions";
import { useToast } from "@/components/ui/use-toast";
import { getAppFeedback } from "@/lib/firestore/ratings-client";

// Define interface for feedback with ID
interface FeedbackWithUserData {
  id: string;
  userId: string;
  userName: string;
  userImageUrl?: string;
  comment: string;
  createdAt: any; // Changed to any to handle both string and Timestamp
  text?: string; // Added text property since we use it in the component
}

interface FeedbackSectionProps {
  appId: string;
  initialFeedback: FeedbackWithUserData[];
}

const MAX_FEEDBACK_LENGTH = 200;

export function FeedbackSection({ appId, initialFeedback }: FeedbackSectionProps) {
  const { userId, isSignedIn } = useAuth();
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackWithUserData[]>(initialFeedback);
  const [isOverLimit, setIsOverLimit] = useState(false);
  
  useEffect(() => {
    setIsOverLimit(comment.length > MAX_FEEDBACK_LENGTH);
  }, [comment]);

  const fetchFeedback = async () => {
    try {
      const result = await getAppFeedback(appId);
      if (result.success && result.feedback) {
        setFeedback(result.feedback as FeedbackWithUserData[]);
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
    }
  };

  const handleSubmit = async () => {
    if (!comment.trim() || isOverLimit) return;
    
    setIsSubmitting(true);
    try {
      const result = await provideFeedback({ 
        appId: appId,
        comment: comment.substring(0, MAX_FEEDBACK_LENGTH)
      });
      
      if (result.success && result.feedbackEntry) {
        setFeedback(prev => [
          {
            id: result.feedbackEntry.id,
            userId: result.feedbackEntry.userId,
            userName: result.feedbackEntry.userName,
            userImageUrl: result.feedbackEntry.userImage,
            comment: result.feedbackEntry.comment,
            createdAt: result.feedbackEntry.createdAt,
            text: result.feedbackEntry.comment // Add text field that matches the comment
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

  const formatCreatedAt = (createdAt: any) => {
    try {
      // Handle Firestore Timestamp
      if (createdAt?.toDate) {
        return formatDistanceToNow(createdAt.toDate(), { addSuffix: true });
      }
      // Handle ISO string
      if (typeof createdAt === 'string') {
        return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
      }
      // Handle Date object
      if (createdAt instanceof Date) {
        return formatDistanceToNow(createdAt, { addSuffix: true });
      }
      return 'Just now';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Recently';
    }
  };

  // FeedbackItem component to handle editing and deleting of individual feedback items
  function FeedbackItem({ feedback, currentUserId, appId, onFeedbackUpdated }: { 
    feedback: FeedbackWithUserData; 
    currentUserId: string | null;
    appId: string;
    onFeedbackUpdated: () => void;
  }) {
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(feedback.comment || feedback.text || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isOwner = currentUserId === feedback.userId;
    
    // Calculate remaining characters
    const remainingChars = MAX_FEEDBACK_LENGTH - editedText.length;
    
    const handleEdit = async () => {
      if (editedText.trim() === "") {
        toast({
          title: "Error",
          description: "Feedback cannot be empty",
          variant: "destructive",
        });
        return;
      }
      
      if (editedText.length > MAX_FEEDBACK_LENGTH) {
        toast({
          title: "Error",
          description: `Feedback must be ${MAX_FEEDBACK_LENGTH} characters or less`,
          variant: "destructive",
        });
        return;
      }
      
      setIsSubmitting(true);
      
      try {
        const result = await editFeedbackAction(appId, feedback.id, editedText);
        
        if (result.success) {
          toast({
            title: "Success",
            description: "Your feedback has been updated",
          });
          setIsEditing(false);
          onFeedbackUpdated();
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update feedback",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error editing feedback:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    };
    
    const handleDelete = async () => {
      setIsSubmitting(true);
      
      try {
        const result = await deleteFeedbackAction(appId, feedback.id);
        
        if (result.success) {
          toast({
            title: "Success",
            description: "Your feedback has been deleted",
          });
          onFeedbackUpdated();
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to delete feedback",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error deleting feedback:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    };
    
    return (
      <div className="bg-card rounded-lg p-4 shadow-sm">
        <div className="flex items-start gap-3">
          {feedback.userImageUrl ? (
            <Image
              src={feedback.userImageUrl}
              alt={feedback.userName || "User"}
              width={40}
              height={40}
              className="rounded-full object-cover h-10 w-10"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              {feedback.userName?.charAt(0) || "A"}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <h4 className="font-medium text-sm">
                {feedback.userName || "Anonymous"}
              </h4>
              <span className="text-xs text-muted-foreground">
                {formatCreatedAt(feedback.createdAt)}
              </span>
            </div>
            
            {isEditing ? (
              <div className="space-y-2 mt-2">
                <Textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  placeholder="Update your feedback..."
                  className="min-h-[100px] w-full"
                  maxLength={MAX_FEEDBACK_LENGTH}
                />
                <div className="flex justify-between items-center">
                  <div className={`text-xs ${remainingChars < 20 ? 'text-red-500' : 'text-gray-500'}`}>
                    {remainingChars} characters remaining
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedText(feedback.comment || feedback.text || "");
                      }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleEdit}
                      disabled={isSubmitting || editedText.trim() === "" || editedText.length > MAX_FEEDBACK_LENGTH}
                    >
                      {isSubmitting ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground break-words whitespace-pre-wrap overflow-hidden">
                {feedback.comment || feedback.text}
              </p>
            )}
          </div>
        </div>
        
        {isOwner && !isEditing && (
          <div className="flex items-center justify-end mt-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your feedback. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isSubmitting}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isSubmitting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Feedback ({feedback.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isSignedIn ? (
          <div className="space-y-2">
            <Textarea
              placeholder="Share your thoughts about this app..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className={`min-h-[100px] ${isOverLimit ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            />
            <div className="flex justify-between items-center">
              <div className={`text-sm ${isOverLimit ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                {comment.length}/{MAX_FEEDBACK_LENGTH} characters
                {isOverLimit && <span className="ml-2">Character limit exceeded</span>}
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !comment.trim() || isOverLimit}
              >
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 bg-muted/30 rounded-lg">
            <p>Sign in to leave feedback</p>
          </div>
        )}

        {feedback.length > 0 ? (
          <div className="space-y-4 mt-4">
            {feedback.map((item, index) => (
              <FeedbackItem 
                key={item.id || index} 
                feedback={item} 
                currentUserId={userId || null}
                appId={appId}
                onFeedbackUpdated={fetchFeedback}
              />
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