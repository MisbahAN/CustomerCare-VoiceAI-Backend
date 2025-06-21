# CustomerCare-VoiceAI Backend

The Node.js backend for the CustomerCare-VoiceAI platform, providing AI-powered conversation APIs, real-time communication, user management services.

## 🌐 Live Demo

- **Frontend**: [https://customer-care-voice-ai-frontend.vercel.app/](https://customer-care-voice-ai-frontend.vercel.app/)
- **Backend API**: [https://customercare-voiceai-backend.onrender.com](https://customercare-voiceai-backend.onrender.com)

## 🌟 Features

- 🤖 **AI-Powered Conversations** – OpenAI GPT-3.5 Turbo integration for intelligent support agents
- 💬 **Real-time Communication** – Socket.io for live chat functionality
- 🎤 **Voice Communication** – LiveKit integration for voice calls
- 🎵 **Text-to-Speech** – OpenAI TTS integration for voice responses
- 🔐 **Secure Authentication** – JWT-based user authentication with bcrypt
- 📈 **Analytics & Tracking** – Basic conversation analytics and metadata
- 🎯 **Agent Management** – Custom AI agent creation and configuration
- 👤 **Avatar Management** – Static avatar images for agents
- 🗄️ **Data Persistence** – MongoDB with Mongoose ODM
- 📁 **Static File Serving** – Avatar images and audio files

## ⚙️ Tech Stack

| Category           | Technology                              |
| ------------------ | --------------------------------------- |
| **Runtime**        | Node.js 16+ with TypeScript             |
| **Framework**      | Express.js                              |
| **Database**       | MongoDB with Mongoose ODM               |
| **Authentication** | JWT tokens with bcrypt password hashing |
| **AI/ML**          | OpenAI GPT-3.5 Turbo & TTS APIs        |
| **Real-time**      | Socket.io, LiveKit                      |
| **File Handling**  | Static file serving                     |
| **Testing**        | Jest with TypeScript (configured)       |
| **Development**    | Nodemon, ESLint, Prettier               |

## 🛠 Project Structure

```
backend/
├── src/
│   ├── models/               # MongoDB schemas
│   │   ├── user.ts          # User authentication and profile
│   │   ├── agent.ts         # AI agent configuration
│   │   └── conversation.ts  # Chat history and analytics
│   ├── routes/              # API endpoints
│   │   ├── auth.ts          # Authentication routes
│   │   ├── agents.ts        # Agent management routes
│   │   ├── conversations.ts # Conversation management
│   │   └── livekit.ts       # Voice call integration
│   ├── services/            # Business logic
│   │   ├── aiService.ts     # OpenAI integration
│   │   └── livekit.ts       # LiveKit voice services
│   ├── controllers/         # Route handlers
│   │   └── conversationController.ts
│   ├── middleware/          # Express middleware
│   │   └── auth.ts          # JWT authentication
│   ├── config/              # Configuration files
│   │   ├── demoAgent.ts     # Demo agent configuration
│   │   └── livekit.ts       # LiveKit configuration
│   ├── types/               # TypeScript definitions
│   │   └── livekit-server-sdk.d.ts # LiveKit type definitions
│   ├── index.ts             # Main server entry point with Socket.io
│   └── app.ts               # Alternative Express-only server setup
├── public/                  # Static files
│   ├── audio/               # Generated audio files (temporary)
│   │   └── *.mp3            # AI-generated speech audio
│   └── avatars/             # Agent avatar images (static assets)
│       ├── ai-avatar.png    # Default AI avatar
│       ├── ai-avatar.svg    # SVG version
│       └── *.png            # Company-specific avatars
├── uploads/                 # File upload directory (placeholder)
├── dist/                    # Compiled JavaScript output
├── node_modules/            # Dependencies
├── backend.log              # Application logs
├── nodemon.json             # Nodemon configuration
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── README.md                # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- MongoDB 8.0.6+
- OpenAI API key
- LiveKit credentials (optional, for voice features)

### Process Cleanup Script

**⚠️ Important**: Before starting the project, run this cleanup script to avoid port conflicts:

```bash
# Kill all nodemon and Node.js processes
pkill -f "nodemon|react-scripts|ts-node"

# Or use specific port cleanup:
lsof -ti:5001 | xargs kill -9  # Kill backend processes
```

### Installation

1. **Navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create environment file**

   Copy `.env.example` to `.env` and configure:

   ```env
   # Server Configuration
   PORT=5001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000

   # Database
   MONGODB_URI=mongodb://localhost:27017/CustomerCare-VoiceAI

   # Authentication
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRES_IN=7d

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4

   # LiveKit Configuration (Optional)
   LIVEKIT_API_KEY=your_livekit_api_key
   LIVEKIT_API_SECRET=your_livekit_api_secret
   LIVEKIT_URL=wss://your-livekit-server.com

   # File Upload Configuration
   MAX_FILE_SIZE=5MB
   UPLOAD_PATH=./uploads
   AVATAR_PATH=./public/avatars
   ALLOWED_FILE_TYPES=png,jpg,jpeg,gif
   ```

4. **Verify required directories exist**

   ```bash
   # Check if directories exist (should already be present)
   ls -la public/avatars/
   ls -la public/audio/
   ls -la uploads/
   ```

5. **Start MongoDB**

   ```bash
   # macOS (using Homebrew)
   brew services start mongodb-community

   # Linux
   sudo systemctl start mongod

   # Windows
   net start MongoDB
   ```

6. **Start the development server**

   ```bash
   npm run dev
   ```

   The server will be available at `http://localhost:5001`

## 🎯 API Endpoints

### Authentication

```typescript
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
POST /api/auth/refresh     # Refresh JWT token
GET  /api/auth/profile     # Get user profile
PUT  /api/auth/profile     # Update user profile
```

### Agent Management

```typescript
GET    /api/agents              # Get user's agents
POST   /api/agents              # Create new agent
GET    /api/agents/:id          # Get specific agent
PUT    /api/agents/:id          # Update agent
DELETE /api/agents/:id          # Delete agent
POST   /api/agents/:id/test     # Test agent response
```

### Conversations

```typescript
GET    /api/conversations                # Get conversation history
POST   /api/conversations                # Create new conversation
GET    /api/conversations/:id            # Get specific conversation
PUT    /api/conversations/:id            # Update conversation
DELETE /api/conversations/:id            # Delete conversation
GET    /api/conversations/:id/messages   # Get conversation messages
POST   /api/conversations/:id/messages   # Send message
GET    /api/conversations/stats/user/:id # Get user conversation statistics
```

### LiveKit Integration

```typescript
POST /api/livekit/token      # Get LiveKit access token
POST /api/livekit/room       # Create voice room
GET  /api/livekit/rooms      # Get active rooms
DELETE /api/livekit/room/:id # End voice room
```

### Static File Serving

```typescript
GET /public/avatars/:filename  # Serve agent avatar images
GET /public/audio/:filename    # Serve generated audio files
```

## 🤖 AI Service Integration

### OpenAI GPT-4 Integration

The backend integrates with OpenAI's GPT-4 for:

- **Company-Specific Agents**: Pre-configured personalities for different companies
- **Conversation Context**: Maintains chat history for coherent responses
- **Sentiment Analysis**: Analyzes customer emotions and satisfaction
- **Intent Recognition**: Identifies customer needs and requests
- **Response Generation**: Creates human-like support responses

### Agent Configuration

Agents are configured with:

```typescript
interface Agent {
  name: string;
  company: string;
  personality: string;
  systemPrompt: string;
  responseStyle: 'formal' | 'casual' | 'friendly' | 'professional';
  maxTokens: number;
  temperature: number;
  userId: ObjectId; // Owner of the agent
}
```

### Static Avatar System

The backend serves pre-built avatar images for agents:

**Features:**

- **Static Avatar Serving**: Serves avatar images from `public/avatars/`
- **Company-Specific Avatars**: Pre-built avatars for different companies
- **Default Avatars**: AI-generated avatars in PNG and SVG formats
- **Optimized Delivery**: Direct static file serving for performance

### Conversation Flow

1. **Message Received**: User sends message via Socket.io
2. **Context Building**: System builds conversation context with agent configuration
3. **AI Processing**: OpenAI GPT-3.5 Turbo processes message with agent personality
4. **Response Generation**: AI generates appropriate text response
5. **Text-to-Speech**: OpenAI TTS converts response to audio
6. **Data Storage**: Saves conversation and metadata to MongoDB
7. **Audio Streaming**: Streams base64-encoded audio back to client

## 🔐 Authentication & Security

### JWT Authentication

- **Token Generation**: Secure JWT tokens with expiration
- **Refresh Tokens**: Automatic token refresh mechanism
- **Route Protection**: Middleware for protected endpoints
- **Role-Based Access**: User permissions and access control

### Security Features

- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Request validation in routes
- **CORS Configuration**: Proper cross-origin resource sharing
- **Environment Variables**: Secure configuration management
- **JWT Token Protection**: Secure token-based authentication
- **MongoDB Security**: Secure database connection and queries

## 📊 Database Schema

### User Model

```typescript
interface User {
  _id: ObjectId;
  name: string;
  email: string;
  password: string; // hashed
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}
```

### Agent Model

```typescript
interface Agent {
  _id: ObjectId;
  name: string;
  company: string;
  personality: string;
  systemPrompt: string;
  responseStyle: string;
  settings: {
    maxTokens: number;
    temperature: number;
  };
  userId: ObjectId; // Owner of the agent
  createdAt: Date;
  updatedAt: Date;
}
```

### Conversation Model

```typescript
interface Conversation {
  _id: ObjectId;
  title: string;
  userId: ObjectId;
  agentId: ObjectId;
  messages: Message[];
  analytics: {
    duration: number;
    messageCount: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    satisfaction: number;
  };
  status: 'active' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

interface Message {
  _id: ObjectId;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    sentiment?: string;
    intent?: string;
    confidence?: number;
  };
}
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build            # Compile TypeScript to JavaScript
npm run start            # Start production server
npm run test             # Run tests
npm run test:watch       # Run tests in watch mode
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
```

### Environment Variables

```env
# Server Configuration
PORT=5001                                    # Server port
NODE_ENV=development                         # Environment mode
FRONTEND_URL=http://localhost:3000           # Frontend URL for CORS

# Database
MONGODB_URI=mongodb://localhost:27017/CustomerCare-VoiceAI

# Authentication
JWT_SECRET=your_jwt_secret_here              # JWT signing secret
JWT_EXPIRES_IN=7d                           # Token expiration

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here     # OpenAI API key
OPENAI_MODEL=gpt-3.5-turbo                  # OpenAI model to use

# LiveKit (Optional)
LIVEKIT_API_KEY=your_livekit_api_key        # LiveKit API key
LIVEKIT_API_SECRET=your_livekit_api_secret  # LiveKit API secret
LIVEKIT_URL=wss://your-livekit-server.com   # LiveKit server URL

# Audio Configuration (Optional)
AUDIO_PATH=./public/audio                   # Audio file storage path
```

### Code Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: TypeScript ESLint configuration
- **Prettier**: Consistent code formatting
- **Jest**: Testing framework (configured, tests pending)
- **Validation**: Inline request validation in routes

### Testing

```bash
# Jest is configured but no test files exist yet
npm test

# Future: Run specific test file
npm test -- auth.test.ts

# Future: Run tests with coverage
npm run test:coverage

# Future: Run tests in watch mode
npm run test:watch
```

## 🎤 Voice Communication

### LiveKit Integration

The backend integrates with LiveKit for real-time voice communication:

- **Room Management**: Create and manage voice rooms
- **Token Generation**: Generate access tokens for clients
- **Participant Management**: Handle user connections and permissions
- **Recording**: Optional conversation recording for training

### Voice Features

- **Real-time Audio**: WebRTC-based voice communication
- **Noise Suppression**: Background noise reduction
- **Echo Cancellation**: Automatic echo cancellation
- **Bandwidth Optimization**: Adaptive bitrate for poor connections

## 📈 Analytics & Monitoring

### Conversation Analytics

- **Basic Metadata**: Conversation duration and message count
- **Conversation Tracking**: Message history and timestamps
- **User Engagement**: Session tracking and conversation flow
- **Agent Performance**: Basic usage statistics

### Monitoring Features

- **Health Checks**: `/health` API endpoint for server status
- **Console Logging**: Basic error and info logging
- **Database Monitoring**: MongoDB connection status
- **Environment Monitoring**: Configuration validation

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Issues**

   ```bash
   # Check MongoDB status
   brew services list | grep mongodb

   # Start MongoDB
   brew services start mongodb-community

   # Check connection
   mongosh --eval "db.adminCommand('ping')"
   ```

2. **OpenAI API Errors**

   ```bash
   # Test API key
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
        https://api.openai.com/v1/models

   # Check rate limits
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
        https://api.openai.com/v1/usage
   ```

3. **Static File Serving Issues**

   ```bash
   # Check avatar directory
   ls -la public/avatars/

   # Test avatar serving
   curl -I http://localhost:5001/public/avatars/ai-avatar.png

   # Check audio file serving
   curl -I http://localhost:5001/public/audio/
   ```

4. **JWT Token Issues**

   ```bash
   # Verify JWT secret is set
   echo $JWT_SECRET

   # Check token in requests
   curl -H "Authorization: Bearer <token>" http://localhost:5001/api/auth/profile
   ```

5. **LiveKit Connection Problems**

   ```bash
   # Test LiveKit credentials
   curl -X POST \
        -H "Authorization: Bearer $LIVEKIT_API_KEY" \
        $LIVEKIT_URL/twirp/livekit.RoomService/ListRooms
   ```

6. **Socket.io Connection Issues**

   ```bash
   # Check if Socket.io is working
   curl -X GET http://localhost:5001/socket.io/

   # Verify CORS configuration
   curl -H "Origin: http://localhost:3000" http://localhost:5001/health
   ```

### Debugging

- **Logging**: Console-based logging for errors and info
- **Debug Mode**: Enable with `NODE_ENV=development`
- **Error Handling**: Basic try-catch blocks with Socket.io error events
- **API Testing**: Test endpoints with curl or Postman
- **Socket.io Testing**: Use browser developer tools for real-time debugging

## 🔄 Deployment

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Environment Setup

```bash
# Production environment variables
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-production-jwt-secret
OPENAI_API_KEY=your-production-openai-key
AUDIO_PATH=./public/audio
```

### Docker Deployment

```dockerfile
FROM node:16-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy built application
COPY dist ./dist

# Copy static assets
COPY public ./public

# Create required directories
RUN mkdir -p uploads public/avatars public/audio

# Set permissions
RUN chmod 755 uploads public/avatars public/audio

EXPOSE 5001

CMD ["npm", "start"]
```

## 🛣️ Future Enhancements

### Planned Features

- [ ] **Advanced Analytics**: Machine learning insights
- [ ] **Multi-language Support**: Internationalization
- [ ] **Advanced Voice Features**: Noise cancellation, echo reduction
- [ ] **Integration APIs**: CRM and helpdesk integrations
- [ ] **Conversation Templates**: Pre-built conversation flows
- [ ] **Advanced Security**: OAuth2, 2FA authentication
- [ ] **Avatar AI Generation**: AI-powered avatar creation
- [ ] **Image Optimization**: Advanced image processing and CDN integration

### Technical Improvements

- [ ] **Microservices**: Break into smaller services
- [ ] **Caching**: Redis integration for performance
- [ ] **Queue System**: Background job processing
- [ ] **GraphQL**: Alternative API interface
- [ ] **Monitoring**: Comprehensive APM integration
- [ ] **Content Delivery**: CDN for avatar and file serving
- [ ] **Advanced File Processing**: Image resizing, format conversion

## 👨‍💻 Author

**Misbah Ahmed Nauman**

- 🌐 [Portfolio](https://misbahan.com)
- 🛠️ Built during Headstarter SWE Residency (Past Project)
