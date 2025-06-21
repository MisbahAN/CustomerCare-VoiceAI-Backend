import * as LiveKit from 'livekit-server-sdk';

export const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || '';
export const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';

// Format the WebSocket URL correctly for LiveKit Cloud
const rawWsUrl = process.env.LIVEKIT_WS_URL || 'customercare-voiceai.livekit.cloud';
export const LIVEKIT_WS_URL = `wss://${rawWsUrl.replace(/^(wss?:\/\/|https?:\/\/)/, '')}`;

// Log LiveKit configuration
console.log('LiveKit Configuration:', {
  wsUrl: LIVEKIT_WS_URL,
  apiKey: {
    isSet: !!LIVEKIT_API_KEY,
    length: LIVEKIT_API_KEY?.length || 0,
  },
  apiSecret: {
    isSet: !!LIVEKIT_API_SECRET,
    length: LIVEKIT_API_SECRET?.length || 0,
  },
});

export const createParticipantToken = async (
  roomName: string,
  participantName: string,
  participantIdentity: string,
): Promise<string> => {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error('LiveKit API key or secret is not configured');
  }

  const at = new LiveKit.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantIdentity,
    name: participantName,
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  return await at.toJwt();
};

export const createRoomToken = async (roomName: string): Promise<string> => {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error('LiveKit API key or secret is not configured');
  }

  const at = new LiveKit.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: 'room-creator',
    name: 'Room Creator',
  });

  at.addGrant({
    roomCreate: true,
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  return await at.toJwt();
};
