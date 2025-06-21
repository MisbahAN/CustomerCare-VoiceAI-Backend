import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import { validateRegistration, validateLogin, sanitizeInput } from '../middleware/validation';

const router = express.Router();

// Register route
router.post('/register', sanitizeInput, validateRegistration, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Input validation is handled by middleware

    console.log(`🔍 Attempting to register user: ${email}`);

    // Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`❌ Registration failed: User ${email} already exists`);
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    console.log(`✅ Email ${email} is available, creating new user...`);

    // Create new user (input is already sanitized by middleware)
    const user = await User.create({
      name,
      email,
      password
    });

    console.log(`✅ User created successfully: ${user._id}`);

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log(`✅ Registration completed for user: ${email}`);

    return res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('🚨 Register error:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      console.log('❌ Validation errors:', validationErrors);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }
    
    if (error.code === 11000) {
      console.log('❌ Duplicate key error - user already exists');
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
      console.log('❌ Database connection error during registration');
      return res.status(503).json({ message: 'Database temporarily unavailable. Please try again.' });
    }

    return res.status(500).json({ 
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login route
router.post('/login', sanitizeInput, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user route
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
});

export default router; 