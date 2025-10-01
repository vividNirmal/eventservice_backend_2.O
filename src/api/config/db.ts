import mongoose from 'mongoose';
import { env } from '../../infrastructure/env';
const connectDB = async (): Promise<void> => {
  
  try {
    const MONGO_URI = env.MONGO_URI;
    // console.log("MONGO_URI...",MONGO_URI)
    if (!MONGO_URI) {
      throw new Error('Mongo URI is not defined in environment variables');
    }

    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;
