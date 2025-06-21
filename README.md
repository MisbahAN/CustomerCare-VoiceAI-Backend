# CustomerCare-VoiceAI Backend

The Node.js backend for the CustomerCare-VoiceAI platform, providing AI-powered conversation APIs, real-time communication, user management services.

## 🌟 Features

- 🤖 **AI-Powered Conversations** – OpenAI GPT-4 integration for intelligent support agents
- 💬 **Real-time Communication** – Socket.io for live chat functionality
- 🎤 **Voice Communication** – LiveKit integration for voice calls
- 📊 **Sentiment Analysis** – Automated conversation tone analysis
- 🔐 **Secure Authentication** – JWT-based user authentication with bcrypt
- 📈 **Analytics & Tracking** – Comprehensive conversation analytics
- 🎯 **Agent Management** – Custom AI agent creation and configuration
- 👤 **Avatar Management** – File upload system for agent profile pictures
- 🗄️ **Data Persistence** – MongoDB with Mongoose ODM
- 📁 **Static File Serving** – Avatar images and uploaded content

## ⚙️ Tech Stack

| Category           | Technology                              |
| ------------------ | --------------------------------------- |
| **Runtime**        | Node.js 16+ with TypeScript             |
| **Framework**      | Express.js                              |
| **Database**       | MongoDB with Mongoose ODM               |
| **Authentication** | JWT tokens with bcrypt password hashing |
| **AI/ML**          | OpenAI GPT-4 API                        |
| **Real-time**      | Socket.io, LiveKit                      |
| **File Handling**  | Multer for file uploads                 |
| **Testing**        | Jest with TypeScript                    |
| **Development**    | Nodemon, ESLint, Prettier               |

## 🛠 Project Structure

```
backend/
├── src/
│   ├── models/               # MongoDB schemas
│   │   ├── User.ts          # User authentication and profile
│   │   ├── Agent.ts         # AI agent configuration with avatar support
│   │   └── Conversation.ts  # Chat history and analytics
│   ├── routes/              # API endpoints
│   │   ├── auth.ts          # Authentication routes
│   │   ├── agents.ts        # Agent management with avatar upload
│   │   ├── conversations.ts # Conversation management
│   │   └── livekit.ts       # Voice call integration
│   ├── services/            # Business logic
│   │   ├── aiService.ts     # OpenAI integration
│   │   └── livekitService.ts # LiveKit voice services
│   ├── controllers/         # Route handlers
│   │   ├── authController.ts
│   │   ├── agentController.ts
│   │   └── conversationController.ts
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts          # JWT authentication
│   │   ├── validation.ts    # Request validation
│   │   ├── upload.ts        # File upload middleware
│   │   └── errorHandler.ts  # Error handling
│   ├── config/              # Configuration files
│   │   ├── database.ts      # MongoDB configuration
│   │   ├── openai.ts        # OpenAI configuration
│   │   ├── livekit.ts       # LiveKit configuration
│   │   └── demoAgents.ts    # Demo agent configurations
│   ├── types/               # TypeScript definitions
│   │   ├── auth.ts          # Authentication types
│   │   ├── agent.ts         # Agent types
│   │   ├── conversation.ts  # Conversation types
│   │   └── api.ts           # API response types
│   ├── utils/               # Utility functions
│   │   ├── logger.ts        # Logging utilities
│   │   ├── validation.ts    # Data validation
│   │   ├── fileUtils.ts     # File handling utilities
│   │   └── helpers.ts       # General helpers
│   ├── socket/              # Socket.io handlers
│   │   ├── chatHandler.ts   # Chat event handlers
│   │   └── socketAuth.ts    # Socket authentication
│   └── index.ts             # Server entry point
├── public/                  # Static files
│   └── avatars/             # Agent avatar images (uploaded and default)
│       ├── AI Avatar.png    # Default agent avatar
├── uploads/                 # File upload directory
├── tests/                   # Test files
│   ├── auth.test.ts
│   ├── agents.test.ts
│   ├── conversations.test.ts
│   └── upload.test.ts
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── .env.example             # Environment variables template
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

4. **Create required directories**

   ```bash
   # Create upload and avatar directories
   mkdir -p public/avatars/uploads
   mkdir -p uploads
   chmod 755 public/avatars uploads
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
POST   /api/agents              # Create new agent (with avatar upload)
GET    /api/agents/:id          # Get specific agent
PUT    /api/agents/:id          # Update agent (with avatar upload)
DELETE /api/agents/:id          # Delete agent
POST   /api/agents/:id/test     # Test agent response
POST   /api/agents/:id/avatar   # Upload/update agent avatar
DELETE /api/agents/:id/avatar   # Delete agent avatar
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
GET /avatars/:filename       # Serve agent avatar images
GET /uploads/:filename       # Serve uploaded files
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
  avatar?: string; // NEW: Avatar file path
  responseStyle: 'formal' | 'casual' | 'friendly' | 'professional';
  maxTokens: number;
  temperature: number;
  userId: ObjectId; // Owner of the agent
  isDefault: boolean; // Whether it's a system default agent
}
```

### Avatar Management System

The backend now includes a comprehensive avatar management system:

```typescript
interface AvatarUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}
```

**Features:**

- **File Upload**: Multer-based file upload with validation
- **Image Processing**: Automatic image optimization and resizing
- **File Type Validation**: Only allows image files (PNG, JPG, JPEG, GIF)
- **Size Limits**: Configurable file size limits (default: 5MB)
- **Path Management**: Organized file storage with unique naming
- **Default Avatars**: Pre-built avatars for system agents

### Conversation Flow

1. **Message Received**: User sends message via Socket.io
2. **Context Building**: System builds conversation context with agent avatar
3. **AI Processing**: OpenAI processes message with agent personality
4. **Response Generation**: AI generates appropriate response
5. **Sentiment Analysis**: Analyzes conversation tone
6. **Data Storage**: Saves conversation and analytics to MongoDB

## 🔐 Authentication & Security

### JWT Authentication

- **Token Generation**: Secure JWT tokens with expiration
- **Refresh Tokens**: Automatic token refresh mechanism
- **Route Protection**: Middleware for protected endpoints
- **Role-Based Access**: User permissions and access control

### Security Features

- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Joi schema validation
- **File Upload Security**: MIME type validation and size limits
- **Path Traversal Protection**: Secure file path handling
- **Rate Limiting**: Express rate limiting middleware
- **CORS Configuration**: Proper cross-origin resource sharing
- **Helmet**: Security headers for Express
- **Environment Variables**: Secure configuration management

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

### Agent Model (Updated)

```typescript
interface Agent {
  _id: ObjectId;
  name: string;
  company: string;
  personality: string;
  systemPrompt: string;
  avatar?: string; // NEW: Avatar file path
  responseStyle: string;
  settings: {
    maxTokens: number;
    temperature: number;
  };
  userId: ObjectId; // Owner of the agent
  isDefault: boolean; // NEW: System default agent flag
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
OPENAI_MODEL=gpt-4                          # OpenAI model to use

# LiveKit (Optional)
LIVEKIT_API_KEY=your_livekit_api_key        # LiveKit API key
LIVEKIT_API_SECRET=your_livekit_api_secret  # LiveKit API secret
LIVEKIT_URL=wss://your-livekit-server.com   # LiveKit server URL

# File Upload (NEW)
MAX_FILE_SIZE=5MB                           # Maximum file upload size
UPLOAD_PATH=./uploads                       # Upload directory path
AVATAR_PATH=./public/avatars                # Avatar storage path
ALLOWED_FILE_TYPES=png,jpg,jpeg,gif         # Allowed file types
```

### Code Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Airbnb configuration with Node.js rules
- **Prettier**: Consistent code formatting
- **Jest**: Unit and integration testing
- **Joi**: Input validation and sanitization

### Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- auth.test.ts

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Test file upload functionality
npm test -- upload.test.ts
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

- **Sentiment Analysis**: Real-time emotion detection
- **Performance Metrics**: Response times and accuracy
- **User Engagement**: Session duration and interaction quality
- **Agent Performance**: Individual agent statistics

### Monitoring Features

- **Health Checks**: API endpoint health monitoring
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Response time and throughput tracking
- **Database Monitoring**: Connection and query performance
- **File System Monitoring**: Upload directory health checks

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

3. **File Upload Issues**

   ```bash
   # Check upload directory permissions
   ls -la uploads/ public/avatars/

   # Create required directories
   mkdir -p public/avatars/uploads uploads
   chmod 755 public/avatars uploads

   # Check file size limits
   ls -lah public/avatars/
   ```

4. **Avatar Serving Issues**

   ```bash
   # Test avatar endpoint
   curl -I http://localhost:5001/avatars/netflix.png

   # Check static file middleware
   curl -I http://localhost:5001/uploads/test-file.jpg
   ```

5. **JWT Token Issues**

   ```bash
   # Verify JWT secret is set
   echo $JWT_SECRET

   # Test token generation
   npm run test -- auth.test.ts
   ```

6. **LiveKit Connection Problems**

   ```bash
   # Test LiveKit credentials
   curl -X POST \
        -H "Authorization: Bearer $LIVEKIT_API_KEY" \
        $LIVEKIT_URL/twirp/livekit.RoomService/ListRooms
   ```

### Debugging

- **Logging**: Comprehensive logging with Winston
- **Debug Mode**: Enable with `DEBUG=app:*`
- **Error Handling**: Centralized error handling middleware
- **API Testing**: Postman collection for API testing
- **File Upload Testing**: Dedicated upload endpoint testing

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
MAX_FILE_SIZE=5MB
AVATAR_PATH=./public/avatars
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

# Create upload directories
RUN mkdir -p uploads public/avatars/uploads

# Set permissions
RUN chmod 755 uploads public/avatars

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
