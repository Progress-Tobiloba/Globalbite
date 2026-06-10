import mongoose from 'mongoose';

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 5000;

let retryCount = 0;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('[DB] MONGODB_URI is not defined in environment variables.');
    process.exit(1);
  }

  const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  mongoose.connection.on('connected', () => {
    console.log('[DB] MongoDB connected successfully.');
    retryCount = 0;
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[DB] MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] MongoDB disconnected. Attempting to reconnect...');
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      setTimeout(connectDB, RETRY_INTERVAL_MS);
    } else {
      console.error('[DB] Max reconnection attempts reached. Shutting down.');
      process.exit(1);
    }
  });

  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('[DB] MongoDB connection closed due to app termination.');
    process.exit(0);
  });

  try {
    await mongoose.connect(uri, options);
  } catch (err) {
    console.error(`[DB] Initial connection failed: ${err.message}`);
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`[DB] Retrying connection in ${RETRY_INTERVAL_MS / 1000}s... (attempt ${retryCount}/${MAX_RETRIES})`);
      setTimeout(connectDB, RETRY_INTERVAL_MS);
    } else {
      console.error('[DB] Could not connect to MongoDB after maximum retries. Exiting.');
      process.exit(1);
    }
  }
};

export default connectDB;
