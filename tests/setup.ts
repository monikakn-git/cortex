import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../src/db/mongoose';

dotenv.config();

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase(); // Clean up test database
  await disconnectDB();
});
