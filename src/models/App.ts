'use server'

import mongoose from 'mongoose';

const appSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a name for your app"],
    maxlength: [60, "Name cannot be more than 60 characters"],
  },
  description: {
    type: String,
    required: [true, "Please provide a description"],
  },
  appType: { 
    type: String, 
    required: true,
    enum: ['website', 'mobile', 'desktop', 'api', 'ai', 'extension'],
    default: 'website'
  },
  category: {
    type: String,
    required: [true, "Please select a category"],
  },
  pricingModel: {
    type: String,
    required: [true, "Please select a pricing model"],
    enum: ["free", "freemium", "paid"],
  },
  repoUrl: { type: String },
  liveUrl: { type: String, required: true },
  iconUrl: { type: String },
  imageUrls: [{ type: String }],
  youtubeUrl: { type: String },
  userId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  likes: {
    count: { type: Number, default: 0 },
    users: [String] // Array of userIds who liked the app
  },
  isPromoted: {
    type: Boolean,
    default: false,
  },
  promotedAt: {
    type: Date,
  },
  ratings: {
    idea: {
      total: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    product: {
      total: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    feedback: {
      count: { type: Number, default: 0 },
    },
    userRatings: [{
      userId: String,
      idea: Number,
      product: Number,
      feedback: Boolean
    }]
  },
  apiEndpoint: { type: String }, // Optional API base URL
  apiDocs: { type: String },    // Optional API documentation URL
  apiType: {                    // Only required if appType is 'api'
    type: String,
    enum: ['rest', 'graphql', 'soap', 'grpc'],
    required: function(this: any) { return this.appType === 'api'; }
  },
  feedback: [
    {
      userId: { type: String, required: true },
      userName: { type: String, required: true },
      userImageUrl: { type: String },
      comment: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    }
  ],
});

// Export model only on server side, null on client
export const App = 
  typeof window === 'undefined' 
    ? (mongoose.models.App || mongoose.model('App', appSchema))
    : null;