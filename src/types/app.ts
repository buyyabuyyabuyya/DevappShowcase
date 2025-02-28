interface App {
  createdAt: string | number | Date;
  _id: string;
  name: string;
  description: string;
  appType: string;
  category: string;
  repoUrl?: string;
  liveUrl: string;
  iconUrl?: string;
  imageUrls: string[];
  youtubeUrl?: string;
  isPromoted: boolean;
  pricing: 'free' | 'paid' | 'freemium';
  apiEndpoint?: string;
  apiDocs?: string;
  apiType?: 'rest' | 'graphql' | 'soap' | 'grpc';
  title?: string;
  type?: string;
  likes: {
    count: number;
  };
}

export type { App }; 