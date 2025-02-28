import { Document } from 'mongoose';

export interface App {
  iconUrl: any;
  _id?: string;
  title: string;
  description: string;
  type: 'website' | 'mobile' | 'desktop' | 'extension' | 'api' | 'ai';
  url: string;
  images: string[];
  userId: string;
  isPromoted: boolean;
  promotionEndDate?: Date;
  createdAt: Date;
}

export interface AppDocument extends Document {
  title: string;
  description: string;
  type: 'website' | 'mobile' | 'desktop' | 'extension' | 'api' | 'ai';
  url: string;
  images: string[];
  userId: string;
  isPromoted: boolean;
  promotionEndDate?: Date;
  createdAt: Date;
} 