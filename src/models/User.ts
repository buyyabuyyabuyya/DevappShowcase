import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  imageUrl: { type: String },
  isPro: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  appCount: { type: Number, default: 0 },
  lastPromotion: { type: Date }
});

// Check if model already exists to prevent overwrite in development
export const User = mongoose.models.User || mongoose.model('User', userSchema); 