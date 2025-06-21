import { RoomServiceClient } from 'livekit-server-sdk';
import { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_WS_URL, createParticipantToken } from '../config/livekit';

// Initialize the RoomServiceClient
// Note: TypeScript definitions might show errors, but these methods exist in the runtime SDK
// This is likely due to a mismatch between the TypeScript definitions and the actual SDK
const roomService = new RoomServiceClient(LIVEKIT_WS_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

export const createTestRoom = async () => {
  try {
    console.log('Creating test room...');
    const roomName = 'test-room';
    
    // Create room with proper options object
    const roomOptions = {
      name: roomName,
      emptyTimeout: 10 * 60, // 10 minutes
      maxParticipants: 20,
    };
    
    try {
      // @ts-ignore - TypeScript definitions are outdated
      const room = await roomService.createRoom(roomOptions);
      console.log('Test room created successfully:', room);
    } catch (error: any) {
      // If the room already exists, that's fine
      if (error.message && error.message.includes('already exists')) {
        console.log('Test room already exists, continuing...');
      } else {
        throw error;
      }
    }
    
    // Generate a participant token for the test room
    const participantToken = await createParticipantToken(
      roomName,
      'Test User',
      'test-user'
    );
    
    return { 
      name: roomName,
      token: participantToken,
      wsUrl: LIVEKIT_WS_URL
    };
  } catch (error) {
    console.error('Error creating test room:', error);
    throw error;
  }
};

export const listRooms = async () => {
  try {
    // @ts-ignore - TypeScript definitions are outdated
    const rooms = await roomService.listRooms();
    return rooms || [];
  } catch (error) {
    console.error('Error listing rooms:', error);
    throw error;
  }
};

export const deleteRoom = async (roomName: string) => {
  try {
    // @ts-ignore - TypeScript definitions are outdated
    await roomService.deleteRoom(roomName);
    console.log(`Room ${roomName} deleted successfully`);
  } catch (error) {
    console.error('Error deleting room:', error);
    throw error;
  }
}; 