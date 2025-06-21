import mongoose, { Schema, Document } from 'mongoose';

export interface IAgent extends Document {
  name: string;
  companyName: string;
  personality: string;
  companyInfo: string;
  prompts: string[];
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AgentSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for the agent'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  companyName: {
    type: String,
    required: [true, 'Please provide a company name'],
    trim: true,
    maxlength: [100, 'Company name cannot be more than 100 characters']
  },
  personality: {
    type: String,
    required: [true, 'Please provide a personality description'],
    trim: true
  },
  companyInfo: {
    type: String,
    required: [true, 'Please provide company information'],
    trim: true
  },
  prompts: [{
    type: String,
    trim: true
  }],
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IAgent>('Agent', AgentSchema); 