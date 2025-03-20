import { Timestamp } from 'firebase/firestore';

export interface App {
  id?: string;
  iconUrl: any;
  name: string;
  description: string;
  appType: 'website' | 'mobile' | 'desktop' | 'extension' | 'api' | 'ai';
  url: string;
  images: string[];
  userId: string;
  isPromoted: boolean;
  promotionEndDate?: Timestamp;
  createdAt: Timestamp;
  category?: string;
}

export interface FeedbackEntry {
  id?: string;
  userId: string;
  userName: string;
  userImage?: string;
  comment: string;
  createdAt: Timestamp;
  appId: string;
}

export interface Rating {
  appId: string;
  userId: string;
  ideaRating: number;
  productRating: number;
  createdAt: Timestamp;
} 