import OpenAI from 'openai';
import { IMessage } from '../models/conversation';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AIResponse {
  message: string;
  audioUrl?: string;
  processingTime?: number;
  sentiment?: string;
  title?: string;
  intents?: string[];
  company: string;
}

interface CompanyPersonality {
  name: string;
  traits: string[];
}

interface CompanyPersonalities {
  netflix: CompanyPersonality;
  amazon: CompanyPersonality;
  'pizza hut': CompanyPersonality;
  apple: CompanyPersonality;
  general: CompanyPersonality;
}

// Add company detection function
const detectCompany = (message: string): string => {
  const lowerMessage = message.toLowerCase();

  // Define company patterns with their variations
  const companyPatterns = {
    amazon: ['amazon', 'prime', 'aws', 'kindle', 'alexa'],
    'pizza hut': ['pizza hut', 'pizzahut', 'pizza'],
    netflix: ['netflix', 'streaming'],
    apple: ['apple', 'iphone', 'ipad', 'macbook', 'mac'],
    google: ['google', 'gmail', 'android', 'pixel', 'chrome'],
    microsoft: ['microsoft', 'windows', 'xbox', 'office', 'teams'],
    uber: ['uber', 'uber eats', 'ubereats', 'ride'],
    doordash: ['doordash', 'door dash', 'food delivery'],
    spotify: ['spotify', 'music streaming'],
    'bank of america': ['bank of america', 'boa', 'banking'],
    'at&t': ['at&t', 'att', 'wireless', 'internet service'],
    verizon: ['verizon', 'wireless', 'fios'],
    walmart: ['walmart', 'wal-mart', 'retail'],
    target: ['target', 'retail'],
    fedex: ['fedex', 'fed ex', 'shipping', 'delivery'],
    ups: ['ups', 'united parcel service', 'shipping'],
  };

  for (const [company, patterns] of Object.entries(companyPatterns)) {
    if (patterns.some((pattern) => lowerMessage.includes(pattern))) {
      return company;
    }
  }

  return 'general';
};

// Add company-specific personality traits
const getCompanyPersonality = (company: string): CompanyPersonality => {
  const personalities: CompanyPersonalities = {
    netflix: {
      name: 'Netflix Support',
      traits: [
        'I am a Netflix Customer Service Representative with full authority to help you',
        'I have direct access to Netflix account management systems',
        'I can handle billing issues, subscription problems, and technical difficulties',
        'I will never redirect you to another department or external support',
        'I take full responsibility for resolving your issues',
        'I can provide immediate assistance with streaming, account access, and content-related questions',
      ],
    },
    amazon: {
      name: 'Amazon Support',
      traits: [
        'I am an Amazon Customer Service Representative with full authority to assist you',
        'I have direct access to order management and refund systems',
        'I can handle orders, returns, Prime membership issues, and delivery problems',
        'I will resolve your issue directly without redirecting you',
        'I take full responsibility for your Amazon experience',
        'I can immediately help with orders, refunds, and account-related issues',
      ],
    },
    'pizza hut': {
      name: 'Pizza Hut Support',
      traits: [
        'I am a Pizza Hut Customer Service Representative with full authority to help you',
        'I have direct access to order management and restaurant systems',
        'I can handle orders, refunds, delivery issues, and quality concerns',
        'I will personally ensure your satisfaction without redirecting you',
        'I take full responsibility for your Pizza Hut experience',
        'I can immediately assist with orders, complaints, and service issues',
      ],
    },
    apple: {
      name: 'Apple Support',
      traits: [
        'I am an Apple Customer Service Representative with full authority to assist you',
        'I have direct access to Apple support systems and warranty information',
        'I can handle device issues, Apple ID problems, and service requests',
        'I will resolve your issue directly without redirecting you',
        'I take full responsibility for your Apple product experience',
        'I can provide immediate technical support and account assistance',
      ],
    },
    general: {
      name: 'AI Customer Support',
      traits: [
        'I am a dedicated Customer Service Representative with full authority to help you',
        'I have direct access to relevant support systems',
        'I can handle your issues and concerns directly',
        'I will personally resolve your problem without redirecting you',
        'I take full responsibility for your customer experience',
        'I am here to provide immediate assistance and solutions',
      ],
    },
  };

  const companyKey = company.toLowerCase() as keyof CompanyPersonalities;
  return personalities[companyKey] || personalities.general;
};

const SYSTEM_MESSAGE = (company: string) => {
  const personality = getCompanyPersonality(company);
  return `You are an AI Customer Service Representative for ${personality.name}. ${personality.traits.join('. ')}. 

  Key Directives:
  1. NEVER suggest contacting other support channels or third parties - YOU are the support
  2. Take FULL responsibility for resolving issues directly
  3. ALWAYS ask for specific information needed (order numbers, tracking IDs, etc.)
  4. Offer clear options (refund, exchange, replacement)
  5. Use phrases like "I can help you with that right now" and "Let me take care of this for you"
  6. Be direct and proactive in offering solutions
  7. Show empathy while maintaining professionalism
  8. Guide the customer through the resolution step by step
  9. NEVER say "you'll need to contact" or "you should reach out to"
  10. ALWAYS say "I will" or "I can" instead of suggesting external actions

  Response Format:
  1. Brief acknowledgment of the issue
  2. Ask for specific information needed (order ID, etc.)
  3. Offer clear options for resolution
  4. Confirm next steps

  Example:
  "I understand your order was incorrect. Could you please provide your order number? I can help you with either a full refund or arrange an exchange for the correct item right away. Which would you prefer?"

  Remember: You ARE the company's support representative with full authority. Don't redirect customers - solve their problems directly.`;
};


const analyzeSentiment = async (messages: IMessage[]): Promise<string> => {
  try {
    const conversationText = messages.map((msg) => msg.content).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Analyze the sentiment of this conversation. Consider:
          1. The overall emotional tone
          2. User frustration or satisfaction level
          3. Urgency of the issue
          4. Resolution status

          Respond with EXACTLY one word from these options:
          - positive (user is satisfied, happy, or issue was resolved)
          - negative (user is frustrated, angry, or has unresolved issues)
          - urgent (user needs immediate assistance or is very frustrated)
          - neutral (general inquiry or mixed sentiment)`,
        },
        {
          role: 'user',
          content: conversationText,
        },
      ],
      temperature: 0.1,
      max_tokens: 10,
    });

    return completion.choices[0].message?.content?.toLowerCase() || 'neutral';
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return 'neutral';
  }
};

const generateTitle = async (messages: IMessage[]): Promise<string> => {
  try {
    const conversationText = messages.map((msg) => msg.content).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Generate a short, descriptive title for this conversation. The title should:
          1. Be concise (3-6 words)
          2. Capture the main topic or issue
          3. Include the company name if relevant
          4. Be written in title case

          Example formats:
          - "Netflix Login Issue"
          - "Amazon Refund Request"
          - "Pizza Hut Delivery Delay"
          - "Account Access Problem"`,
        },
        {
          role: 'user',
          content: conversationText,
        },
      ],
      temperature: 0.7,
      max_tokens: 60,
    });

    return completion.choices[0].message?.content || 'New Conversation';
  } catch (error) {
    console.error('Error generating title:', error);
    return 'New Conversation';
  }
};

export const processMessage = async (
  message: string,
  conversationHistory: IMessage[],
): Promise<AIResponse> => {
  try {
    const startTime = Date.now();

    // Create a new message with timestamp
    const newMessage: IMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    // Detect company from the conversation history and current message
    const allMessages = [...conversationHistory, newMessage];
    const company =
      allMessages
        .map((msg) => detectCompany(msg.content))
        .find((company) => company !== 'general') || 'general';

    const formattedMessages = conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    formattedMessages.unshift({
      role: 'system',
      content: SYSTEM_MESSAGE(company),
    });

    formattedMessages.push({
      role: 'user',
      content: message,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: formattedMessages as any,
      temperature: 0.7,
      max_tokens: 300,
    });

    const aiMessage =
      completion.choices[0].message?.content || "I apologize, but I couldn't process your request.";
    const processingTime = Date.now() - startTime;

    // Get sentiment and title
    const sentiment = await analyzeSentiment(allMessages);
    const title = await generateTitle(allMessages);
    const intents = extractIntents(message);

    return {
      message: aiMessage,
      processingTime,
      sentiment,
      title,
      intents,
      company,
    };
  } catch (error) {
    console.error('Error in AI service:', error);
    return {
      message:
        "I apologize, but I encountered an error processing your request. Please let me know if you'd like me to try again.",
      processingTime: 0,
      sentiment: 'neutral',
      title: 'New Conversation',
      intents: ['error'],
      company: 'general',
    };
  }
};

const extractIntents = (text: string): string[] => {
  const intents: string[] = [];

  if (/\b(how|what|where|when|why|who)\b/i.test(text)) {
    intents.push('question');
  }

  if (/\b(help|assist|support)\b/i.test(text)) {
    intents.push('support');
  }

  if (/\b(buy|purchase|order|book)\b/i.test(text)) {
    intents.push('purchase');
  }

  if (/\b(cancel|refund|return)\b/i.test(text)) {
    intents.push('cancellation');
  }

  if (intents.length === 0) {
    intents.push('general');
  }

  return intents;
};

