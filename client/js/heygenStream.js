/**
 * HeyGen Streaming Client
 * Handles WebRTC connection and avatar streaming
 * 
 * For Dr Geoff Drewery - CSIRO Mentor Avatar
 */
class HeyGenStreamClient {
  constructor() {
    this.sessionId = null;
    this.peerConnection = null;
    this.videoElement = null;
    this.onStatusChange = null;
    this.onError = null;
    this.onSpeakingChange = null;
  }

  /**
   * Initialize the streaming client
   */
  init(videoElement, callbacks = {}) {
    this.videoElement = videoElement;
    this.onStatusChange = callbacks.onStatusChange || (() => {});
    this.onError = callbacks.onError || console.error;
    this.onSpeakingChange = callbacks.onSpeakingChange || (() => {});
  }

  /**
   * Connect to HeyGen streaming session
   */
  async connect() {
    try {
      this.onStatusChange('connecting');

      // Step 1: Create new session
      console.log('Creating HeyGen session...');
      const sessionResponse = await fetch('/api/heygen/session/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.details || 'Failed to create session');
      }

      const sessionData = await sessionResponse.json();
      
      if (!sessionData.data || !sessionData.data.session_id) {
        throw new Error('Invalid session response from HeyGen');
      }
      
      this.sessionId = sessionData.data.session_id;
      const iceServers = sessionData.data.ice_servers2 || sessionData.data.ice_servers || [];

      console.log('Session created:', this.sessionId);

      // Step 2: Create RTCPeerConnection
      const rtcConfig = {
        iceServers: iceServers.map(server => ({
          urls: server.urls,
          username: server.username,
          credential: server.credential
        }))
      };
      
      // Add fallback STUN server if none provided
      if (rtcConfig.iceServers.length === 0) {
        rtcConfig.iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
      }
      
      this.peerConnection = new RTCPeerConnection(rtcConfig);

      // Handle incoming video stream
      this.peerConnection.ontrack = (event) => {
        console.log('Received track:', event.track.kind);
        if (event.track.kind === 'video' && this.videoElement) {
          this.videoElement.srcObject = event.streams[0];
          this.videoElement.play().catch(e => console.warn('Autoplay blocked:', e));
        }
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          try {
            await fetch('/api/heygen/session/ice', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                session_id: this.sessionId,
                candidate: event.candidate
              })
            });
          } catch (error) {
            console.error('Error sending ICE candidate:', error);
          }
        }
      };

      // Handle ICE connection state changes
      this.peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', this.peerConnection.iceConnectionState);
      };

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', this.peerConnection.connectionState);
        
        switch (this.peerConnection.connectionState) {
          case 'connected':
            this.onStatusChange('connected');
            break;
          case 'disconnected':
          case 'failed':
          case 'closed':
            this.onStatusChange('disconnected');
            break;
        }
      };

      // Step 3: Create and set local description (offer)
      // Add transceivers for receiving video and audio
      this.peerConnection.addTransceiver('video', { direction: 'recvonly' });
      this.peerConnection.addTransceiver('audio', { direction: 'recvonly' });

      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      console.log('Local description set, sending to server...');

      // Step 4: Send offer to server and get answer
      const startResponse = await fetch('/api/heygen/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: this.sessionId,
          sdp: this.peerConnection.localDescription
        })
      });

      if (!startResponse.ok) {
        const errorData = await startResponse.json();
        throw new Error(errorData.details || 'Failed to start session');
      }

      const startData = await startResponse.json();

      if (!startData.data || !startData.data.sdp) {
        throw new Error('Invalid start response from HeyGen');
      }

      // Step 5: Set remote description (answer)
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(startData.data.sdp)
      );

      console.log('WebRTC connection established successfully');
      return true;

    } catch (error) {
      console.error('Connection error:', error);
      this.onError(error);
      this.onStatusChange('disconnected');
      await this.cleanup();
      return false;
    }
  }

  /**
   * Send text for avatar to speak
   */
  async speak(text) {
    if (!this.sessionId) {
      throw new Error('No active session');
    }

    try {
      this.onSpeakingChange(true);
      
      const response = await fetch('/api/heygen/session/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: this.sessionId,
          text: text
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to send text');
      }

      const result = await response.json();
      
      // Estimate speaking duration (rough: ~150ms per character)
      const estimatedDuration = Math.max(2000, text.length * 80);
      setTimeout(() => {
        this.onSpeakingChange(false);
      }, estimatedDuration);

      return result;

    } catch (error) {
      console.error('Speak error:', error);
      this.onSpeakingChange(false);
      this.onError(error);
      throw error;
    }
  }

  /**
   * Interrupt current speech
   */
  async interrupt() {
    if (!this.sessionId) return;

    try {
      this.onSpeakingChange(false);
      
      await fetch('/api/heygen/session/interrupt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: this.sessionId
        })
      });
    } catch (error) {
      console.error('Interrupt error:', error);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect() {
    try {
      // Close session on server
      if (this.sessionId) {
        await fetch('/api/heygen/session/close', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: this.sessionId
          })
        }).catch(e => console.warn('Error closing session:', e));
      }

      await this.cleanup();
      this.sessionId = null;
      this.onStatusChange('disconnected');
      this.onSpeakingChange(false);

    } catch (error) {
      console.error('Disconnect error:', error);
      await this.cleanup();
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.peerConnection?.connectionState === 'connected';
  }

  /**
   * Get current session ID
   */
  getSessionId() {
    return this.sessionId;
  }
}

// Export for use in app.js
window.HeyGenStreamClient = HeyGenStreamClient;
