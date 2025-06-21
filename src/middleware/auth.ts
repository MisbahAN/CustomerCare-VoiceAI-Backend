import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user';

export interface IUserRequest extends Request {
  user?: any;
}

export const auth = async (req: IUserRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    console.log('Auth Header:', authHeader);
    
    const token = authHeader?.replace('Bearer ', '');
    console.log('Token:', token);
    
    if (!token) {
      console.log('No token provided');
      throw new Error('No token provided');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
    console.log('Decoded token:', decoded);
    
    const user = await User.findById(decoded.userId);
    console.log('Found user:', user?._id);
    
    if (!user) {
      console.log('User not found');
      throw new Error('User not found');
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Please authenticate.' });
  }
}; 