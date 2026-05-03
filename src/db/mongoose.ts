import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cortex_test';

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB Connected for KPI Tracking');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB Disconnected');
  } catch (error) {
    console.error('MongoDB Disconnection Error:', error);
  }
};
