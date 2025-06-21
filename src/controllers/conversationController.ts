import { Request, Response } from 'express';
import Conversation, { IConversation } from '../models/conversation';
import { processMessage } from '../services/aiService';
import { IUserRequest } from '../middleware/auth';

export const createConversation = async (req: IUserRequest, res: Response) => {
  try {
    const { title } = req.body;
    
    const conversation = new Conversation({
      userId: req.user?._id,
      title: title || 'New Conversation',
      messages: []
    });
    
    await conversation.save();
    
    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ message: 'Error creating conversation' });
  }
};

export const getConversations = async (req: IUserRequest, res: Response) => {
  try {
    const conversations = await Conversation.find({ userId: req.user?._id })
      .sort({ 'metadata.updated': -1 })
      .select('title metadata');
    
    res.status(200).json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Error fetching conversations' });
  }
};

export const getConversation = async (req: IUserRequest, res: Response) => {
  try {
    const conversation = await Conversation.findOne({ 
      _id: req.params.id,
      userId: req.user?._id
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    res.status(200).json(conversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ message: 'Error fetching conversation' });
  }
};

export const addMessage = async (req: IUserRequest, res: Response) => {
  try {
    const { content, audioUrl } = req.body;
    const conversationId = req.params.id;
    
    const conversation = await Conversation.findOne({ 
      _id: conversationId,
      userId: req.user?._id
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    conversation.messages.push({
      role: 'user',
      content,
      timestamp: new Date(),
      audioUrl
    });
    
    const aiResponse = await processMessage(content, conversation.messages);
    
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse.message,
      timestamp: new Date(),
      audioUrl: aiResponse.audioUrl
    });
    
    conversation.metadata.updated = new Date();
    conversation.metadata.duration += aiResponse.processingTime || 0;
    if (aiResponse.sentiment) {
      conversation.metadata.sentiment = aiResponse.sentiment;
    }
    if (aiResponse.intents && aiResponse.intents.length) {
      conversation.metadata.intents = [
        ...new Set([...conversation.metadata.intents, ...aiResponse.intents])
      ];
    }
    
    await conversation.save();
    
    res.status(200).json({
      message: aiResponse.message,
      audioUrl: aiResponse.audioUrl,
      conversation: conversation
    });
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ message: 'Error processing message' });
  }
}; 