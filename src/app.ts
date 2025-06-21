import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import conversationRoutes from './routes/conversations';
import companyAgentRoutes from './routes/agents';
import authRoutes from './routes/auth';
import livekitRoutes from './routes/livekit';

dotenv.config();

const app = express();

// CORS configuration for production
const corsOptions = {
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001',
    'https://customer-care-voice-ai-frontend.vercel.app',
    process.env.FRONTEND_URL
  ].filter((url): url is string => typeof url === 'string' && url.length > 0),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Debug CORS configuration
console.log('CORS Origins:', corsOptions.origin);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// Health check route
app.get('/health', (_, res) => {
  console.log('🔍 Health check endpoint hit');
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running', 
    database: dbStatus,
    timestamp: new Date().toISOString() 
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/company-agents', companyAgentRoutes);
app.use('/api/livekit', livekitRoutes);

// MongoDB connection with retry logic
const connectToMongoDB = async (retries = 5) => {
  const mongoOptions = {
    retryWrites: true,
    w: 'majority' as const,
    ssl: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferMaxEntries: 0,
    bufferCommands: false,
  };

  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(
        process.env.MONGODB_URI || 'mongodb://localhost:27017/customercare-voiceai',
        mongoOptions
      );
      console.log('✅ Connected to MongoDB successfully');
      return;
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${i + 1} failed:`, error);
      
      if (i === retries - 1) {
        console.error('🚨 All MongoDB connection attempts failed. Exiting...');
        process.exit(1);
      }
      
      const delay = Math.min(1000 * Math.pow(2, i), 30000);
      console.log(`⏳ Retrying connection in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Initialize MongoDB connection
connectToMongoDB();

// Handle MongoDB connection events
mongoose.connection.on('error', (error) => {
  console.error('🚨 MongoDB connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected. Attempting to reconnect...');
  connectToMongoDB();
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully');
});

// Error handling middleware
app.use((err: any, _: express.Request, res: express.Response, __: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = parseInt(process.env.PORT || '5001', 10);
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Health endpoint available at /health');
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

export default app;
