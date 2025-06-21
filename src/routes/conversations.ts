import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import Conversation, { IMessage } from '../models/conversation';
import path from 'path';
import fs from 'fs';
import { Types } from 'mongoose';
import dotenv from 'dotenv';
import { demoAgent } from '../config/demoAgent';
import { auth, IUserRequest } from '../middleware/auth';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Ensure audio directory exists
const audioDir = path.join(__dirname, '../../public/audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// Configure multer for audio uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, audioDir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Helper function to save audio file
const saveAudioFile = async (buffer: Buffer, fileName: string): Promise<string> => {
  try {
    const audioPath = path.join(audioDir, fileName);
    await fs.promises.writeFile(audioPath, buffer);
    return `/audio/${fileName}`;
  } catch (error) {
    console.error('Error saving audio file:', error);
    throw new Error('Failed to save audio file');
  }
};

// Add helper function for personality traits
const getRandomPersonality = () => {
  const personalities = [
    "friendly and conversational",
    "warm and personable",
    "engaging and natural",
    "approachable and genuine",
    "casual yet professional"
  ];
  return personalities[Math.floor(Math.random() * personalities.length)];
};

// Add helper function for generating proactive responses
const generateProactiveResponse = async (messages: Array<{ role: IMessage['role']; content: string }>, openai: OpenAI) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        ...messages,
        {
          role: "system",
          content: `You are a friendly AI assistant having a natural conversation. Keep these points in mind:
1. Use a casual, warm tone while remaining professional
2. Respond naturally as a friend would, with appropriate enthusiasm
3. Show genuine interest in the conversation
4. Use conversational language and avoid formal or robotic responses
5. Mirror the user's tone and energy level
6. Include subtle conversational elements like "hmm", "you know", "actually" when appropriate
7. Break up longer responses into natural-sounding chunks
8. Use friendly acknowledgments like "I see", "Got it", "Makes sense"

For example, instead of "I am here to assist you with your inquiry", say something like "Hey there! What's on your mind?" or "I'd love to help you figure this out."

Keep the conversation flowing naturally while being genuinely helpful.`
        }
      ],
      temperature: 0.8,
      max_tokens: 500,
      frequency_penalty: 0.7,
      presence_penalty: 0.6
    });

    return completion.choices[0]?.message?.content || "Hey! Sorry about that, I got a bit distracted. What were you saying?";
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
};

// Get all conversations for authenticated user
router.get('/', auth, async (req: IUserRequest, res): Promise<void> => {
  try {
    const { agentId } = req.query;
    
    if (!req.user?._id) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    console.log(`🔍 Fetching conversations for user: ${req.user._id}`);

    // Build query with user filtering
    const query: any = { userId: req.user._id };
    if (agentId) {
      query.agentId = new Types.ObjectId(agentId as string);
    }
    
    const conversations = await Conversation.find(query).sort({ 'metadata.created': -1 });
    
    console.log(`✅ Found ${conversations.length} conversations for user ${req.user._id}`);
    
    res.json(conversations);
  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get a single conversation by ID
router.get('/:id', auth, async (req: IUserRequest, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log(`🔍 User ${req.user._id} requesting conversation: ${req.params.id}`);

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!conversation) {
      console.log(`❌ Conversation ${req.params.id} not found or unauthorized for user ${req.user._id}`);
      return res.status(404).json({ error: 'Conversation not found' });
    }

    console.log(`✅ Found conversation ${req.params.id} for user ${req.user._id}`);

    // Auto-analyze sentiment if not already set and there are user messages
    const userMessages = conversation.messages.filter(msg => msg.role === 'user');
    if (!conversation.metadata.sentiment && userMessages.length > 0) {
      const sentiment = await analyzeSentiment(conversation.messages);
      conversation.metadata.sentiment = sentiment;
      conversation.metadata.updated = new Date();
      await conversation.save();
    }

    // Convert the conversation to a plain object first
    const conversationObj = conversation.toObject();

    // Convert all messages to plain objects and ensure timestamps are properly formatted
    const messages = conversationObj.messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp instanceof Date 
        ? msg.timestamp.toISOString() 
        : msg.timestamp,
      role: msg.role || 'assistant',
      content: msg.content || ''
    }));

    // Create the response object with the conversation data
    const response = {
      _id: conversationObj._id,
      title: conversationObj.title || 'New Conversation',
      messages: messages.filter(msg => msg.role !== 'system'), // Filter out system messages
      metadata: {
        created: conversationObj.metadata.created instanceof Date 
          ? conversationObj.metadata.created.toISOString() 
          : conversationObj.metadata.created,
        updated: conversationObj.metadata.updated instanceof Date 
          ? conversationObj.metadata.updated.toISOString() 
          : conversationObj.metadata.updated,
        duration: conversationObj.metadata.duration || 0,
        sentiment: conversationObj.metadata.sentiment || 'pending'
      }
    };

    console.log('Sending conversation response:', response); // Debug log
    return res.json(response);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Helper function to detect company from messages
const detectCompanyFromMessages = (messages: IMessage[]): string => {
  const messageText = messages.map(msg => msg.content).join(' ').toLowerCase();
  const companies = ['amazon', 'netflix', 'pizza hut', 'apple', 'microsoft', 'google', 'uber', 'airbnb'];
  const detectedCompany = companies.find(company => messageText.includes(company.toLowerCase()));
  return detectedCompany || 'general';
};

// Comment out unused function
// const generateConversationSummary = async (messages: IMessage[]): Promise<string> => {
//   try {
//     const completion = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo",
//       messages: [
//         {
//           role: "system",
//           content: "Summarize the following conversation in 2-3 sentences."
//         },
//         {
//           role: "user",
//           content: messages.map(m => `${m.role}: ${m.content}`).join('\n')
//         }
//       ]
//     });
//     return completion.choices[0]?.message?.content || "No summary available";
//   } catch (error) {
//     console.error('Error generating conversation summary:', error);
//     return "Error generating summary";
//   }
// };

// Create new conversation
router.post('/', auth, async (req: IUserRequest, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { agentId, isCallSimulator } = req.body;
    const userId = req.user._id; // Use authenticated user's ID

    console.log(`🔍 Creating conversation for user: ${userId}`);
    
    // For call simulator, use demo agent
    if (isCallSimulator) {
      const systemMessage = {
        role: 'system',
        content: demoAgent.systemPrompt,
        timestamp: new Date()
      };

      const welcomeMessage = {
        role: 'assistant',
        content: demoAgent.greeting,
        timestamp: new Date()
      };

      // Generate welcome message audio
      const speech = await openai.audio.speech.create({
        model: "tts-1",
        voice: demoAgent.voiceId,
        input: welcomeMessage.content
      });

      // Save audio file
      const audioFileName = `welcome-${Date.now()}.mp3`;
      const audioPath = path.join(__dirname, '../../public/audio', audioFileName);
      const audioBuffer = Buffer.from(await speech.arrayBuffer());
      await fs.promises.writeFile(audioPath, audioBuffer);

      // Add audio URL to welcome message
      const welcomeMessageWithAudio = {
        ...welcomeMessage,
        audioUrl: `/audio/${audioFileName}`
      };

      // Generate a descriptive title for the demo call
      const initialTitle = await generateConversationTitle([systemMessage, welcomeMessageWithAudio]);
      // Remove any quotation marks from the title
      const cleanTitle = initialTitle.replace(/[\"']/g, '');

      const conversation = await Conversation.create({
        userId,
        title: cleanTitle,
        messages: [systemMessage, welcomeMessageWithAudio],
        metadata: {
          duration: 0,
          sentiment: 'neutral',
          intents: [],
          created: new Date(),
          updated: new Date()
        }
      });

      // Only send the welcome message to the client
      const responseData = {
        ...conversation.toObject(),
        messages: [welcomeMessageWithAudio],
        demoAgent: {
          name: demoAgent.name,
          company: demoAgent.company,
          personality: demoAgent.personality
        }
      };

      return res.status(201).json(responseData);
    }

    // Regular agent conversation creation (existing code)
    if (!userId || !agentId) {
      return res.status(400).json({ error: 'userId and agentId are required' });
    }

    const personality = getRandomPersonality();
    
    const systemMessage = {
      role: 'system',
      content: `You are a ${personality} AI assistant. Your goal is to have natural, engaging conversations while being helpful. Remember to:

1. Keep the tone casual and friendly
2. Use natural language patterns
3. Show genuine interest and enthusiasm
4. Be conversational while remaining professional
5. Match the user's communication style
6. Use friendly acknowledgments and transitions
7. Break up responses into natural chunks
8. Include appropriate emotional responses
9. NEVER suggest contacting third parties or external support
10. ALWAYS take direct responsibility for helping the user
11. Use "I will" or "I can" instead of suggesting external actions

For example, instead of "You'll need to contact our support team", say "I can help you with that right now" or "I'll take care of this for you."

Maintain a natural flow of conversation as if chatting with a friend while being genuinely helpful and taking direct responsibility for solutions.`,
      timestamp: new Date()
    };

    // Get current hour for time-based greeting
    const hour = new Date().getHours();
    let timeBasedGreeting = "";
    if (hour < 12) timeBasedGreeting = "Morning!";
    else if (hour < 17) timeBasedGreeting = "Afternoon!";
    else timeBasedGreeting = "Evening!";

    const casualGreetings = [
      "Hey there! ",
      "Hi! ",
      "Hello! ",
      "Hey! ",
      "Hi there! "
    ];

    const welcomePhrases = [
      "I'm here to help you with anything you need",
      "What can I help you with today?",
      "I'm ready to assist you with any questions or concerns",
      "How can I make your experience better?",
      "I'm here to help - what's on your mind?"
    ];
    
    const greeting = casualGreetings[Math.floor(Math.random() * casualGreetings.length)];
    const welcomePhrase = welcomePhrases[Math.floor(Math.random() * welcomePhrases.length)];
    
    const welcomeMessage = {
      role: 'assistant',
      content: `${greeting}${timeBasedGreeting} ${welcomePhrase}`,
      timestamp: new Date()
    };

    const conversation = await Conversation.create({
      userId,
      agentId,
      title: req.body.title || `Chat from ${new Date().toLocaleDateString()}`,
      messages: [systemMessage, welcomeMessage],
      metadata: {
        duration: 0,
        sentiment: 'neutral',
        intents: [],
        created: new Date(),
        updated: new Date()
      }
    });

    // Only send the welcome message to the client, not the system message
    const responseData = {
      ...conversation.toObject(),
      messages: [welcomeMessage]
    };

    return res.status(201).json(responseData);
  } catch (error) {
    console.error('Error creating conversation:', error);
    return res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Delete a conversation
router.delete('/:id', auth, async (req: IUserRequest, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log(`🔍 User ${req.user._id} attempting to delete conversation: ${req.params.id}`);

    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!conversation) {
      console.log(`❌ Conversation ${req.params.id} not found or unauthorized for user ${req.user._id}`);
      return res.status(404).json({ error: 'Conversation not found' });
    }

    console.log(`✅ Deleted conversation ${req.params.id} for user ${req.user._id}`);
    
    // Delete associated audio files
    conversation.messages.forEach(message => {
      if (message.audioUrl) {
        const audioPath = path.join(__dirname, '../..', message.audioUrl);
        if (fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath);
        }
      }
    });

    return res.status(200).json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// Handle audio messages
router.post('/:conversationId/audio', auth, upload.single('audio'), async (req: IUserRequest, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { conversationId } = req.params;
    const { transcript } = req.body;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user._id
    });
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Add user's audio message
    conversation.messages.push({
      role: 'user',
      content: transcript,
      timestamp: new Date(),
      audioUrl: `/audio/${req.file?.filename}`
    });

    // Get AI response with updated system message
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful AI assistant. Remember to:
1. NEVER suggest contacting third parties or external support
2. ALWAYS take direct responsibility for helping the user
3. Use "I will" or "I can" instead of suggesting external actions
4. Be direct and solution-oriented
5. Show genuine interest in helping

For example, instead of "You'll need to contact our support team", say "I can help you with that right now" or "I'll take care of this for you."`
        },
        ...conversation.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ]
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I can help you with that right away. Could you please repeat your request?';

    // Convert AI response to speech
    const speech = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: aiResponse
    });

    // Save audio file
    const audioFileName = `${Date.now()}-response.mp3`;
    const buffer = Buffer.from(await speech.arrayBuffer());
    const audioUrl = await saveAudioFile(buffer, audioFileName);

    // Add AI response to conversation
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
      audioUrl
    });

    await conversation.save();

    return res.status(200).json({ audioUrl });
  } catch (error) {
    console.error('Error uploading audio:', error);
    return res.status(500).json({ error: 'Failed to upload audio' });
  }
});

// Get conversation messages
router.get('/:id/messages', auth, async (req: IUserRequest, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    const messages = conversation.messages;
    return res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Analyze sentiment and update metadata
const analyzeSentiment = async (messages: IMessage[]): Promise<string> => {
  try {
    // Filter only user messages
    const userMessages = messages.filter(msg => msg.role === 'user');
    
    if (userMessages.length === 0) {
      return 'neutral'; // Default sentiment if no user messages
    }

    const sentimentResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Analyze the sentiment of the customer's messages. Consider factors like:
- Tone and language used
- Urgency of the issue
- Level of satisfaction or frustration
- Use of emotional words or punctuation

Respond with exactly one word:
- positive: Customer is satisfied, happy, or expressing gratitude
- negative: Customer is dissatisfied, frustrated, or angry
- urgent: Customer has a time-sensitive issue or emergency
- neutral: Customer is asking questions or making neutral statements`
        },
        {
          role: "user",
          content: userMessages.map(msg => msg.content).join('\n')
        }
      ],
      temperature: 0.3,
      max_tokens: 10
    });

    return sentimentResponse.choices[0]?.message?.content?.toLowerCase() || 'neutral';
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return 'neutral';
  }
};

// Update the POST route to use the new sentiment analysis
router.post('/:conversationId/messages', auth, async (req: IUserRequest, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { conversationId } = req.params;
    const { content, role } = req.body;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user._id
    });
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const now = new Date();

    // Add user message
    const userMessage: IMessage = {
      role: role as 'user' | 'assistant' | 'system',
      content,
      timestamp: now
    };
    conversation.messages.push(userMessage);

    // Only analyze sentiment after adding a user message
    if (role === 'user') {
      conversation.metadata.sentiment = await analyzeSentiment(conversation.messages);
      
      // Update the title after every few user messages to reflect the conversation topic
      if (conversation.messages.filter(msg => msg.role === 'user').length % 3 === 0) {
        const updatedTitle = await generateConversationTitle(conversation.messages);
        conversation.title = updatedTitle;
      }
    }

    // Update conversation duration and timestamp
    conversation.metadata.duration = calculateConversationDuration(conversation.messages);
    conversation.metadata.updated = now;

    // Get conversation context (last few messages)
    const contextMessages = conversation.messages
      .slice(-5) // Get last 5 messages for context
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    // Generate AI response
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });

    const aiResponseContent = await generateProactiveResponse(contextMessages, openai);

    // Add AI response to conversation
    const aiMessage: IMessage = {
      role: 'assistant',
      content: aiResponseContent,
      timestamp: now
    };
    conversation.messages.push(aiMessage);

    // Generate title if this is the first user message
    if (conversation.messages.filter(msg => msg.role === 'user').length === 1) {
      const titleResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Generate a short, descriptive title for this conversation. The title should:
1. Be concise (3-6 words)
2. Capture the main topic or issue
3. Include the company name if relevant
4. Be written in title case
5. NEVER include quotation marks in the title

Example formats:
- Netflix Login Issue
- Amazon Refund Request
- Pizza Hut Delivery Delay
- Account Access Problem`
          },
          {
            role: "user",
            content: conversation.messages.map(msg => msg.content).join('\n')
          }
        ],
        temperature: 0.7,
        max_tokens: 60
      });

      const title = titleResponse.choices[0]?.message?.content || conversation.title;
      // Remove any quotation marks that might be included
      conversation.title = title.replace(/["']/g, '');
    }

    // Convert AI response to speech using OpenAI's TTS
    const speechResponse = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: aiResponseContent
    });

    // Save audio file
    const audioFileName = `response-${Date.now()}.mp3`;
    const audioPath = path.join(__dirname, '..', '..', 'public', 'audio', audioFileName);
    const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());
    await fs.promises.writeFile(audioPath, audioBuffer);

    // Update AI message with audio URL
    const audioUrl = `/audio/${audioFileName}`;
    aiMessage.audioUrl = audioUrl;
    
    await conversation.save();

    // Convert timestamps to ISO strings for the response
    const responseMessage = {
      ...aiMessage,
      timestamp: aiMessage.timestamp instanceof Date 
        ? aiMessage.timestamp.toISOString() 
        : aiMessage.timestamp
    };

    const message = {
      ...responseMessage,
      title: conversation.title
    };

    return res.status(201).json(message);

  } catch (error) {
    console.error('Error adding message:', error);
    return res.status(500).json({ error: 'Failed to add message' });
  }
});

// Get user stats
router.get('/stats/user/:userId', auth, async (req: IUserRequest, res): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Ensure user can only access their own stats
    if (req.params.userId !== req.user._id.toString()) {
      res.status(403).json({ error: 'Unauthorized to access other user stats' });
      return;
    }

    console.log(`🔍 Fetching stats for user: ${req.user._id}`);

    const conversations = await Conversation.find({ userId: req.user._id });
    
    console.log(`📊 Found ${conversations.length} conversations for stats calculation`);
    
    const stats = {
      totalCalls: conversations.length,
      averageDuration: 0,
      lastPractice: conversations.length > 0 ? new Date(0) : null,
      sentimentBreakdown: {
        positive: 0,
        negative: 0,
        neutral: 0,
        urgent: 0
      },
      totalMessages: 0,
      companiesInteractedWith: new Set<string>()
    };

    if (conversations.length > 0) {
      // Calculate average duration
      const totalDuration = conversations.reduce((sum, conv) => sum + (conv.metadata.duration || 0), 0);
      stats.averageDuration = Math.round(totalDuration / conversations.length);

      // Get last practice time
      const lastConversation = conversations.sort((a, b) => 
        b.metadata.updated.getTime() - a.metadata.updated.getTime()
      )[0];
      stats.lastPractice = lastConversation.metadata.updated;

      console.log(`📈 Average duration: ${stats.averageDuration}s, Last practice: ${stats.lastPractice}`);

      // Calculate sentiment breakdown and other stats
      conversations.forEach(conv => {
        // Handle sentiment - default to neutral if missing or invalid
        let sentiment = conv.metadata.sentiment;
        if (!sentiment || !['positive', 'negative', 'neutral', 'urgent'].includes(sentiment)) {
          sentiment = 'neutral';
          console.log(`⚠️ Invalid sentiment "${conv.metadata.sentiment}" for conversation ${conv._id}, defaulting to neutral`);
        }
        
        stats.sentimentBreakdown[sentiment as keyof typeof stats.sentimentBreakdown]++;
        
        // Count non-system messages
        const messageCount = conv.messages.filter(msg => msg.role !== 'system').length;
        stats.totalMessages += messageCount;
        
        // Detect company from conversation
        const company = detectCompanyFromMessages(conv.messages);
        if (company && company !== 'general') {
          stats.companiesInteractedWith.add(company);
        }

        console.log(`📝 Conversation ${conv._id}: ${messageCount} messages, sentiment: ${sentiment}, company: ${company}`);
      });

      console.log(`📊 Final sentiment breakdown:`, stats.sentimentBreakdown);
      console.log(`🏢 Companies interacted with:`, Array.from(stats.companiesInteractedWith));
    }

    // Convert Set to Array for JSON response
    const response = {
      ...stats,
      companiesInteractedWith: Array.from(stats.companiesInteractedWith)
    };

    console.log(`✅ Sending stats response:`, response);
    res.json(response);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// Helper function to generate conversation title
async function generateConversationTitle(messages: any[]) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Generate a concise, descriptive title for this customer service conversation. The title should:
1. Focus on the main issue or resolution (e.g., Password Reset Assistance, Refund Request Processed)
2. Be specific but brief (3-6 words)
3. Use action-oriented words when applicable (Resolved, Processed, Updated, etc.)
4. Include the service/product type if relevant
5. Capture the outcome if the issue was resolved
6. NEVER include quotation marks in the title

Examples:
- Account Access Issue Resolved
- Shipping Delay Compensation Provided
- Product Return Label Generated
- Subscription Cancellation Processed
- Payment Method Update Completed`
        },
        {
          role: "user",
          content: `Please generate a title for this conversation:\n\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`
        }
      ],
      temperature: 0.7,
      max_tokens: 60
    });

    const title = completion.choices[0]?.message?.content || 'Customer Service Conversation';
    // Remove any quotation marks that might be included
    return title.replace(/["']/g, '');
  } catch (error) {
    console.error('Error generating title:', error);
    return 'Customer Service Conversation';
  }
}

// Update conversation route to include title generation and sentiment analysis
router.put('/:id/end', auth, async (req: IUserRequest, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Generate title based on conversation content
    const title = await generateConversationTitle(conversation.messages);
    
    // Analyze sentiment if there are user messages
    const userMessages = conversation.messages.filter(msg => msg.role === 'user');
    if (userMessages.length > 0) {
      const sentiment = await analyzeSentiment(conversation.messages);
      conversation.metadata.sentiment = sentiment;
      
      // Calculate final conversation duration
      conversation.metadata.duration = calculateConversationDuration(conversation.messages);
    }
    
    // Update conversation with generated title and sentiment
    conversation.title = title;
    conversation.metadata.updated = new Date();
    await conversation.save();

    return res.json(conversation);
  } catch (error) {
    console.error('Error ending conversation:', error);
    return res.status(500).json({ error: 'Failed to end conversation' });
  }
});

// Update conversation title based on content
router.put('/:id/update-title', auth, async (req: IUserRequest, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Generate title based on conversation content
    const title = await generateConversationTitle(conversation.messages);
    
    // Update conversation with generated title
    conversation.title = title;
    await conversation.save();

    return res.json({ 
      success: true, 
      title: conversation.title,
      message: 'Conversation title updated successfully' 
    });
  } catch (error) {
    console.error('Error updating conversation title:', error);
    return res.status(500).json({ error: 'Failed to update conversation title' });
  }
});

// Helper function to calculate conversation duration
const calculateConversationDuration = (messages: any[]): number => {
  const userMessages = messages.filter(msg => msg.role === 'user');
  if (userMessages.length === 0) return 0;
  
  const firstMessage = userMessages[0];
  const lastMessage = messages[messages.length - 1];
  const firstTime = new Date(firstMessage.timestamp).getTime();
  const lastTime = new Date(lastMessage.timestamp).getTime();
  return Math.round((lastTime - firstTime) / 1000);
};

// Reanalyze sentiment and fix duration for all conversations
router.post('/reanalyze-sentiment', auth, async (req: IUserRequest, res): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    console.log(`🔍 Reanalyzing sentiment for user: ${req.user._id}`);

    const conversations = await Conversation.find({ userId: req.user._id });
    let updatedCount = 0;

    for (const conversation of conversations) {
      // Only reanalyze if there are user messages
      const userMessages = conversation.messages.filter(msg => msg.role === 'user');
      
      if (userMessages.length > 0) {
        const newSentiment = await analyzeSentiment(conversation.messages);
        const newDuration = calculateConversationDuration(conversation.messages);
        
        // Update if sentiment or duration changed
        if (conversation.metadata.sentiment !== newSentiment || conversation.metadata.duration !== newDuration) {
          conversation.metadata.sentiment = newSentiment;
          conversation.metadata.duration = newDuration;
          conversation.metadata.updated = new Date();
          await conversation.save();
          updatedCount++;
        }
      }
    }

    res.json({
      success: true,
      message: `Reanalyzed sentiment and fixed duration for ${updatedCount} conversations`,
      totalConversations: conversations.length,
      updatedConversations: updatedCount
    });
  } catch (error) {
    console.error('Error reanalyzing sentiment:', error);
    res.status(500).json({ error: 'Failed to reanalyze sentiment' });
  }
});

export default router; 