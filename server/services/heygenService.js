const axios = require('axios');

const HEYGEN_API_BASE = 'https://api.heygen.com';

class HeyGenService {
  constructor() {
    this.apiKey = process.env.HEYGEN_API_KEY;
    this.avatarId = process.env.HEYGEN_AVATAR_ID;
    this.voiceId = process.env.HEYGEN_VOICE_ID;
    
    if (!this.apiKey) {
      console.warn('⚠️ HEYGEN_API_KEY not set in environment variables');
    }
    
    this.axiosInstance = axios.create({
      baseURL: HEYGEN_API_BASE,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Create a new streaming session
   * Returns session_id and ICE servers for WebRTC
   */
  async createStreamingSession() {
    try {
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
      console.error('Error creating streaming session:', error.response?.data || error.message);
      throw error;
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
      console.error('Error starting session:', error.response?.data || error.message);
      throw error;
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
      console.error('Error sending text:', error.response?.data || error.message);
      throw error;
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
      console.error('Error sending ICE candidate:', error.response?.data || error.message);
      throw error;
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
      console.error('Error closing session:', error.response?.data || error.message);
      throw error;
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
      console.error('Error interrupting session:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new HeyGenService();
