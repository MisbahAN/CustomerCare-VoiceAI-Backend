import express from 'express';
import { createParticipantToken, createRoomToken, LIVEKIT_WS_URL } from '../config/livekit';
import { createTestRoom, listRooms, deleteRoom } from '../services/livekit';

const router = express.Router();

// Create a test room
router.post('/create-test-room', async (_req, res) => {
  try {
    console.log('Creating test room...');
    const roomData = await createTestRoom();
    console.log('Test room created successfully:', roomData);
    return res.json(roomData);
  } catch (error) {
    console.error('Error creating test room:', error);
    return res.status(500).json({ error: 'Failed to create test room' });
  }
});

// List all rooms
router.get('/rooms', async (_req, res) => {
  try {
    const rooms = await listRooms();
    return res.json(rooms);
  } catch (error) {
    console.error('Error listing rooms:', error);
    return res.status(500).json({ error: 'Failed to list rooms' });
  }
});

// Delete a room
router.delete('/rooms/:roomName', async (req, res) => {
  try {
    const { roomName } = req.params;
    await deleteRoom(roomName);
    return res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    return res.status(500).json({ error: 'Failed to delete room' });
  }
});

// Create a new room and get tokens
router.post('/create-room', async (req, res) => {
  try {
    const { roomName, participantName, participantIdentity } = req.body;
    console.log('Creating room with params:', { roomName, participantName, participantIdentity });

    if (!roomName || !participantName || !participantIdentity) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const [roomToken, participantToken] = await Promise.all([
      createRoomToken(roomName),
      createParticipantToken(roomName, participantName, participantIdentity)
    ]);

    console.log('Room created successfully');
    console.log('WebSocket URL:', LIVEKIT_WS_URL);
    
    return res.json({
      roomToken,
      participantToken,
      wsUrl: LIVEKIT_WS_URL,
      roomName,
    });
  } catch (error) {
    console.error('Error creating room:', error);
    return res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get participant token for existing room
router.post('/join-room', async (req, res) => {
  try {
    const { roomName, participantName, participantIdentity } = req.body;
    console.log('Joining room with params:', { roomName, participantName, participantIdentity });

    if (!roomName || !participantName || !participantIdentity) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const participantToken = await createParticipantToken(roomName, participantName, participantIdentity);
    console.log('Participant token generated successfully');
    console.log('WebSocket URL:', LIVEKIT_WS_URL);

    return res.json({
      participantToken,
      wsUrl: LIVEKIT_WS_URL,
      roomName,
    });
  } catch (error) {
    console.error('Error joining room:', error);
    return res.status(500).json({ error: 'Failed to join room' });
  }
});

export default router; 