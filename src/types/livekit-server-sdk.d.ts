declare module 'livekit-server-sdk' {
  export class AccessToken {
    constructor(apiKey: string, apiSecret: string, options?: {
      identity?: string;
      name?: string;
    });
    
    addGrant(grant: {
      roomCreate?: boolean;
      roomJoin?: boolean;
      room?: string;
      canPublish?: boolean;
      canSubscribe?: boolean;
    }): void;
    
    toJwt(): string;
  }
  
  // Add other LiveKit types as needed
  export class RoomServiceClient {
    constructor(host: string, apiKey: string, apiSecret: string);
  }
  
  export class WebhookReceiver {
    constructor(apiKey: string, apiSecret: string);
  }
} 