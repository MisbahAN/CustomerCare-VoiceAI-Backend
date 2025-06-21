// File: backend/src/models/conversation.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date | string;
  audioUrl?: string;
}

export interface IConversation extends Document {
  userId: mongoose.Types.ObjectId;
  agentId?: mongoose.Types.ObjectId;
  title: string;
  messages: IMessage[];
  metadata: {
    duration: number;
    sentiment: string;
    intents: string[];
    created: Date;
    updated: Date;
  };
}

const ConversationSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  agentId: { type: Schema.Types.ObjectId, ref: 'Agent', required: false },
  title: { type: String, required: true },
  messages: [{
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    audioUrl: { type: String }
  }],
  metadata: {
    duration: { type: Number, default: 0 },
    sentiment: { type: String },
    intents: [{ type: String }],
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now }
  }
});

export default mongoose.model<IConversation>('Conversation', ConversationSchema);