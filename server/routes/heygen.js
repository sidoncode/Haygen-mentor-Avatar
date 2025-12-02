const express = require('express');
const router = express.Router();
const heygenService = require('../services/heygenService');

// Create new streaming session
router.post('/session/new', async (req, res) => {
  try {
    const result = await heygenService.createStreamingSession();
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to create session',
      details: error.response?.data || error.message 
    });
  }
});

// Start session with SDP
router.post('/session/start', async (req, res) => {
  try {
    const { session_id, sdp } = req.body;
    
    if (!session_id || !sdp) {
      return res.status(400).json({ error: 'session_id and sdp required' });
    }
    
    const result = await heygenService.startSession(session_id, sdp);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to start session',
      details: error.response?.data || error.message 
    });
  }
});

// Send text to avatar
router.post('/session/speak', async (req, res) => {
  try {
    const { session_id, text } = req.body;
    
    if (!session_id || !text) {
      return res.status(400).json({ error: 'session_id and text required' });
    }
    
    const result = await heygenService.sendText(session_id, text);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to send text',
      details: error.response?.data || error.message 
    });
  }
});

// Send ICE candidate
router.post('/session/ice', async (req, res) => {
  try {
    const { session_id, candidate } = req.body;
    
    if (!session_id || !candidate) {
      return res.status(400).json({ error: 'session_id and candidate required' });
    }
    
    const result = await heygenService.sendIceCandidate(session_id, candidate);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to send ICE candidate',
      details: error.response?.data || error.message 
    });
  }
});

// Close session
router.post('/session/close', async (req, res) => {
  try {
    const { session_id } = req.body;
    
    if (!session_id) {
      return res.status(400).json({ error: 'session_id required' });
    }
    
    const result = await heygenService.closeSession(session_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to close session',
      details: error.response?.data || error.message 
    });
  }
});

// Interrupt avatar speech
router.post('/session/interrupt', async (req, res) => {
  try {
    const { session_id } = req.body;
    
    if (!session_id) {
      return res.status(400).json({ error: 'session_id required' });
    }
    
    const result = await heygenService.interruptSession(session_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to interrupt session',
      details: error.response?.data || error.message 
    });
  }
});

module.exports = router;
