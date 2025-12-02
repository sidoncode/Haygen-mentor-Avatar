const axios = require('axios');

const HEYGEN_API_BASE = 'https://api.heygen.com';

class HeyGenService {
  constructor() {
    this.apiKey = process.env.HEYGEN_API_KEY;
    this.avatarId = process.env.HEYGEN_AVATAR_ID;
    this.voiceId = process.env.HEYGEN_VOICE_ID;
    
    // Log configuration status on startup
    console.log('=== HeyGen Service Configuration ===');
    console.log('API Key:', this.apiKey ? `Set (${this.apiKey.substring(0, 8)}...)` : '❌ NOT SET');
    console.log('Avatar ID:', this.avatarId || '❌ NOT SET');
    console.log('Voice ID:', this.voiceId || '❌ NOT SET');
    console.log('===================================');
    
    this.axiosInstance = axios.create({
      baseURL: HEYGEN_API_BASE,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });
  }

  /**
   * Validate that all required credentials are configured
   */
  validateConfig() {
    const missing = [];
    if (!this.apiKey) missing.push('HEYGEN_API_KEY');
    if (!this.avatarId) missing.push('HEYGEN_AVATAR_ID');
    if (!this.voiceId) missing.push('HEYGEN_VOICE_ID');
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  /**
   * Extract meaningful error message from axios error
   */
  extractErrorMessage(error) {
    if (error.response) {
      // Server responded with error
      const data = error.response.data;
      if (typeof data === 'string') return data;
      if (data.message) return data.message;
      if (data.error) return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
      if (data.detail) return data.detail;
      return `HeyGen API error (${error.response.status}): ${JSON.stringify(data)}`;
    } else if (error.request) {
      // Request made but no response
      return 'No response from HeyGen API. Check your network connection.';
    } else {
      // Error setting up request
      return error.message || 'Unknown error occurred';
    }
  }

  /**
   * Create a new streaming session
   * Returns session_id and ICE servers for WebRTC
   */
  async createStreamingSession() {
    try {
      // Validate configuration first
      this.validateConfig();
      
      console.log('Creating streaming session...');
      console.log('Avatar ID:', this.avatarId);
      console.log('Voice ID:', this.voiceId);
      
      const response = await this.axiosInstance.post('/v1/streaming.new', {
        quality: 'high',
        avatar_name: this.avatarId,
        voice: {
          voice_id: this.voiceId,
          rate: 1.0
        }
      });

      console.log('Session created successfully:', response.data.data?.session_id);
      return response.data;
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      console.error('Error creating streaming session:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Start the streaming session after WebRTC connection
   */
  async startSession(sessionId, sdp) {
    try {
      console.log('Starting session:', sessionId);
      
      const response = await this.axiosInstance.post('/v1/streaming.start', {
        session_id: sessionId,
        sdp: sdp
      });

      console.log('Session started successfully');
      return response.data;
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      console.error('Error starting session:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Send text for the avatar to speak
   */
  async sendText(sessionId, text) {
    try {
      console.log('Sending text to avatar:', text.substring(0, 50) + '...');
      
      const response = await this.axiosInstance.post('/v1/streaming.task', {
        session_id: sessionId,
        text: text,
        task_type: 'talk'
      });

      console.log('Text sent successfully');
      return response.data;
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      console.error('Error sending text:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Send ICE candidate for WebRTC connection
   */
  async sendIceCandidate(sessionId, candidate) {
    try {
      const response = await this.axiosInstance.post('/v1/streaming.ice', {
        session_id: sessionId,
        candidate: candidate
      });

      return response.data;
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      console.error('Error sending ICE candidate:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Stop and close the streaming session
   */
  async closeSession(sessionId) {
    try {
      console.log('Closing session:', sessionId);
      
      const response = await this.axiosInstance.post('/v1/streaming.stop', {
        session_id: sessionId
      });

      console.log('Session closed successfully');
      return response.data;
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      console.error('Error closing session:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Interrupt current speech (useful for user interruptions)
   */
  async interruptSession(sessionId) {
    try {
      console.log('Interrupting session:', sessionId);
      
      const response = await this.axiosInstance.post('/v1/streaming.interrupt', {
        session_id: sessionId
      });

      return response.data;
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      console.error('Error interrupting session:', errorMessage);
      throw new Error(errorMessage);
    }
  }
}

module.exports = new HeyGenService();
