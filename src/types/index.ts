export interface App {
  id: string;
  iconUrl?: string;
  name: string;
  description: string;
  appType: 'website' | 'mobile' | 'desktop' | 'extension' | 'api' | 'ai';
  liveUrl?: string;
  imageUrls?: string[];
  userId: string;
  isPromoted: boolean;
  promotionEndDate?: string;
  createdAt: string;
  updatedAt?: string;
  category?: string;
  pricingModel?: string;
  repoUrl?: string;
  youtubeUrl?: string;
  likes: {
    count: number;
    users: string[];
  };
  ratings: {
    idea: {
      total: number;
      count: number;
    };
    product: {
      total: number;
      count: number;
    };
    feedback: {
      count: number;
    };
    userRatings: any[];
  };
}

export interface FeedbackEntry {
  id?: string;
  userId: string;
  userName: string;
  userImage?: string;
  comment: string;
  createdAt: string;
  appId: string;
}

export interface Rating {
  appId: string;
  userId: string;
  ideaRating: number;
  productRating: number;
  createdAt: string;
} 