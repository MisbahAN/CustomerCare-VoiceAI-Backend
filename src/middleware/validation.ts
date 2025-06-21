import { Request, Response, NextFunction } from 'express';

export const validateRegistration = (req: Request, res: Response, next: NextFunction): void => {
  const { name, email, password } = req.body;
  
  // Check for required fields
  if (!name || !email || !password) {
    res.status(400).json({
      message: 'All fields are required',
      fields: { 
        name: !name ? 'Name is required' : null,
        email: !email ? 'Email is required' : null,
        password: !password ? 'Password is required' : null
      }
    });
    return;
  }

  // Validate name
  if (name.trim().length < 2) {
    res.status(400).json({ message: 'Name must be at least 2 characters long' });
    return;
  }

  if (name.trim().length > 50) {
    res.status(400).json({ message: 'Name cannot exceed 50 characters' });
    return;
  }

  // Validate email
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: 'Please provide a valid email address' });
    return;
  }

  // Validate password
  if (password.length < 6) {
    res.status(400).json({ message: 'Password must be at least 6 characters long' });
    return;
  }

  if (password.length > 128) {
    res.status(400).json({ message: 'Password is too long' });
    return;
  }

  // Check password strength (optional but recommended)
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    res.status(400).json({ 
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
    });
    return;
  }

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    res.status(400).json({
      message: 'Email and password are required',
      fields: {
        email: !email ? 'Email is required' : null,
        password: !password ? 'Password is required' : null
      }
    });
    return;
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: 'Please provide a valid email address' });
    return;
  }

  next();
};

export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body.name) {
    req.body.name = req.body.name.trim();
  }
  
  if (req.body.email) {
    req.body.email = req.body.email.toLowerCase().trim();
  }
  
  next();
};