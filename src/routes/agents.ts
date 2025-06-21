import express from 'express';
import Agent from '../models/agent';
import { auth, IUserRequest } from '../middleware/auth';

const router = express.Router();

// Get all agents for the authenticated user
router.get('/', auth, async (req: IUserRequest, res) => {
  try {
    const agents = await Agent.find({ userId: req.user._id });
    return res.json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    return res.status(500).json({ message: 'Server error while fetching agents' });
  }
});

// Get a single agent by ID
router.get('/:id', auth, async (req: IUserRequest, res) => {
  try {
    const agent = await Agent.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    return res.json(agent);
  } catch (error) {
    console.error('Error fetching agent:', error);
    return res.status(500).json({ message: 'Server error while fetching agent' });
  }
});

// Create a new agent
router.post('/', auth, async (req: IUserRequest, res) => {
  try {
    console.log('Creating agent with body:', req.body);
    console.log('User ID:', req.user?._id);

    const { name, companyName, personality, companyInfo, prompts } = req.body;

    if (!name || !companyName || !personality || !companyInfo) {
      console.log('Missing required fields:', { name, companyName, personality, companyInfo });
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const agent = await Agent.create({
      name,
      companyName,
      personality,
      companyInfo,
      prompts: prompts || [],
      userId: req.user._id
    });

    console.log('Created agent:', agent);
    return res.status(201).json(agent);
  } catch (error) {
    console.error('Detailed error creating agent:', error);
    if (error instanceof Error) {
      return res.status(500).json({ message: `Error creating agent: ${error.message}` });
    } else {
      return res.status(500).json({ message: 'Server error while creating agent' });
    }
  }
});

// Update an agent
router.put('/:id', auth, async (req: IUserRequest, res) => {
  try {
    const { name, companyName, personality, companyInfo, prompts } = req.body;

    const agent = await Agent.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id
      },
      {
        name,
        companyName,
        personality,
        companyInfo,
        prompts
      },
      { new: true, runValidators: true }
    );

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    return res.json(agent);
  } catch (error) {
    console.error('Error updating agent:', error);
    return res.status(500).json({ message: 'Server error while updating agent' });
  }
});

// Delete an agent
router.delete('/:id', auth, async (req: IUserRequest, res) => {
  try {
    const agent = await Agent.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    return res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return res.status(500).json({ message: 'Server error while deleting agent' });
  }
});

export default router; 