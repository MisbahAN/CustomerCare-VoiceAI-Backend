// File: backend/src/index.ts
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables first
dotenv.config({ path: path.join(__dirname, '../.env') });

import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import Conversation from './models/conversation';
import OpenAI from 'openai';
import { demoAgent } from './config/demoAgent';

// Import routes
import conversationRoutes from './routes/conversations';
import authRoutes from './routes/auth';
import agentRoutes from './routes/agents';
import livekitRoutes from './routes/livekit';

const app = express();
const server = http.createServer(app);

// Configure CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Configure socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Serve static files
app.use('/audio', express.static(path.join(__dirname, '..', 'public', 'audio')));

// Use routes
app.use('/api/conversations', conversationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/livekit', livekitRoutes);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// MongoDB connection options
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
};

// Connect to MongoDB with retry logic
const connectWithRetry = () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/customercare-voiceai';
  console.log('Attempting MongoDB connection to:', mongoUri);

  mongoose
    .connect(mongoUri, mongooseOptions)
    .then(() => {
      console.log('Successfully connected to MongoDB');
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error);
      console.log('Retrying connection in 5 seconds...');
      setTimeout(connectWithRetry, 5000);
    });
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

// Initial connection attempt
connectWithRetry();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('user_message', async (data) => {
    try {
      // Emit typing indicator
      socket.emit('typing', true);

      const conversation = await Conversation.findById(data.conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Add user message
      const userMessage = {
        role: 'user' as const,
        content: data.message,
        timestamp: new Date(),
      };
      conversation.messages.push(userMessage);

      // Generate AI response
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: data.isCallSimulator
              ? demoAgent.systemPrompt
              : `You are ${data.agentInfo?.name}, a customer service representative for ${data.agentInfo?.company}. 
              Personality: ${data.agentInfo?.personality}
              Company Information: ${data.agentInfo?.companyInfo}
              ${data.agentInfo?.prompts?.join('\n') || ''}`,
          },
          ...conversation.messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        ],
      });

      const aiResponse =
        completion.choices[0]?.message?.content ||
        'I apologize, but I am having trouble generating a response.';

      // Convert AI response to speech
      const speech = await openai.audio.speech.create({
        model: 'tts-1',
        voice: data.isCallSimulator ? demoAgent.voiceId : 'alloy',
        input: aiResponse,
      });

      // Save audio file
      const audioFileName = `response-${Date.now()}.mp3`;
      const audioPath = path.join(__dirname, '..', 'public', 'audio', audioFileName);
      const audioBuffer = Buffer.from(await speech.arrayBuffer());
      await fs.promises.writeFile(audioPath, audioBuffer);

      // Add AI response to conversation
      const aiMessage = {
        role: 'assistant' as const,
        content: aiResponse,
        timestamp: new Date(),
        audioUrl: `/audio/${audioFileName}`,
      };
      conversation.messages.push(aiMessage);

      await conversation.save();

      // Emit the AI response with demo agent info if in call simulator mode
      socket.emit('ai_response', {
        message: aiResponse,
        audioUrl: `/audio/${audioFileName}`,
        ...(data.isCallSimulator && {
          demoAgent: {
            name: demoAgent.name,
            company: demoAgent.company,
            personality: demoAgent.personality,
          },
        }),
      });
    } catch (error) {
      console.error('Error processing message:', error);
      socket.emit('error', { message: 'Failed to process message' });
    } finally {
      socket.emit('typing', false);
    }
  });

  socket.on('start_conversation', async (data) => {
    try {
      console.log('Starting conversation with data:', data);
      const { userId, isCallSimulator } = data;

      if (!userId) {
        throw new Error('userId is required');
      }

      let systemMessage: {
        role: 'system';
        content: string;
        timestamp: Date;
      };

      let welcomeMessage: {
        role: 'assistant';
        content: string;
        timestamp: Date;
        audioUrl?: string;
      };

      if (isCallSimulator) {
        console.log('Creating demo agent conversation');
        systemMessage = {
          role: 'system',
          content: demoAgent.systemPrompt,
          timestamp: new Date(),
        };

        welcomeMessage = {
          role: 'assistant',
          content: demoAgent.greeting,
          timestamp: new Date(),
        };
      } else {
        if (!data.agentId || !data.agentInfo) {
          throw new Error('agentId and agentInfo are required for non-simulator conversations');
        }

        systemMessage = {
          role: 'system',
          content: `You are ${data.agentInfo.name}, a customer service representative for ${data.agentInfo.company}. 
          Personality: ${data.agentInfo.personality}
          Company Information: ${data.agentInfo.companyInfo}
          ${data.agentInfo.prompts.join('\n')}`,
          timestamp: new Date(),
        };

        welcomeMessage = {
          role: 'assistant',
          content: `Hi, I'm ${data.agentInfo.name}. How can I help you today?`,
          timestamp: new Date(),
        };
      }

      // Generate welcome message audio
      const speech = await openai.audio.speech.create({
        model: 'tts-1',
        voice: isCallSimulator ? demoAgent.voiceId : 'alloy',
        input: welcomeMessage.content,
      });

      // Save audio file
      const audioFileName = `welcome-${Date.now()}.mp3`;
      const audioPath = path.join(__dirname, '..', 'public', 'audio', audioFileName);
      const audioBuffer = Buffer.from(await speech.arrayBuffer());
      await fs.promises.writeFile(audioPath, audioBuffer);

      // Add audio URL to welcome message
      welcomeMessage.audioUrl = `/audio/${audioFileName}`;

      // Generate a descriptive title for the demo call
      let conversationTitle;
      if (isCallSimulator) {
        // For demo calls, generate a title based on the conversation content
        const titleResponse = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `Generate a short, descriptive title for this demo call conversation. The title should:
              1. Be concise (3-6 words)
              2. Capture the main topic or issue
              3. Be written in title case
              4. Focus on the purpose of the demo call

              Example formats:
              - "Product Demo Overview"
              - "Service Features Walkthrough"
              - "Technical Support Demo"
              - "Customer Service Simulation"`,
            },
            {
              role: 'user',
              content: `System message: ${systemMessage.content}\n\nWelcome message: ${welcomeMessage.content}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 60,
        });
        conversationTitle = titleResponse.choices[0]?.message?.content || 'Demo Call';
      } else {
        conversationTitle = `Chat with ${data.agentInfo?.name} at ${new Date().toLocaleDateString()}`;
      }

      // Create conversation with conditional agentId
      const conversationData: any = {
        userId,
        title: conversationTitle,
        messages: [systemMessage, welcomeMessage],
        metadata: {
          duration: 0,
          sentiment: 'neutral',
          intents: [],
          created: new Date(),
          updated: new Date(),
        },
      };

      // Only add agentId if not in call simulator mode
      if (!isCallSimulator && data.agentId) {
        conversationData.agentId = data.agentId;
      }

      const conversation = await Conversation.create(conversationData);

      // Emit conversation started event
      socket.emit('conversation_started', {
        conversationId: conversation._id,
        welcomeMessage,
        ...(isCallSimulator && {
          demoAgent: {
            name: demoAgent.name,
            company: demoAgent.company,
            personality: demoAgent.personality,
          },
        }),
      });
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      socket.emit('error', {
        message: 'Failed to start conversation',
        details: error?.message || 'Unknown error',
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment variables loaded:', {
    MONGODB_URI: process.env.MONGODB_URI,
    PORT: process.env.PORT,
    FRONTEND_URL: process.env.FRONTEND_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Set' : 'Not set',
  });
});
