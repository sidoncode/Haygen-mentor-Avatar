/**
 * Main Application
 * Dr Geoff Drewery - CSIRO Mentor Avatar
 * 
 * This handles the UI interactions and chat functionality.
 * In production, integrate with Azure OpenAI for LLM responses.
 */
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const elements = {
    video: document.getElementById('avatarVideo'),
    placeholder: document.getElementById('avatarPlaceholder'),
    speakingIndicator: document.getElementById('speakingIndicator'),
    connectBtn: document.getElementById('connectBtn'),
    disconnectBtn: document.getElementById('disconnectBtn'),
    interruptBtn: document.getElementById('interruptBtn'),
    status: document.getElementById('connectionStatus'),
    chatMessages: document.getElementById('chatMessages'),
    userInput: document.getElementById('userInput'),
    sendBtn: document.getElementById('sendBtn'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingText: document.getElementById('loadingText')
  };

  // State
  let isProcessing = false;

  // Initialize HeyGen client
  const heygenClient = new HeyGenStreamClient();

  heygenClient.init(elements.video, {
    onStatusChange: handleStatusChange,
    onError: handleError,
    onSpeakingChange: handleSpeakingChange
  });

  /**
   * Status change handler
   */
  function handleStatusChange(status) {
    elements.status.className = 'status';
    
    switch (status) {
      case 'connecting':
        elements.status.textContent = 'Connecting...';
        elements.status.classList.add('status-connecting');
        break;
        
      case 'connected':
        elements.status.textContent = 'Connected';
        elements.status.classList.add('status-connected');
        elements.placeholder.classList.add('hidden');
        elements.connectBtn.disabled = true;
        elements.disconnectBtn.disabled = false;
        elements.interruptBtn.disabled = false;
        elements.userInput.disabled = false;
        elements.sendBtn.disabled = false;
        hideLoading();
        
        // Welcome message from Dr Drewery
        const welcomeMessage = "G'day! I'm Dr Geoff Drewery from CSIRO. " +
          "Great to have you here for a mentoring session. " +
          "I specialise in concentrated solar thermal research and renewable energy. " +
          "What aspect of your research would you like to explore today?";
        
        addMessage('avatar', welcomeMessage);
        
        // Make avatar speak the welcome
        heygenClient.speak(welcomeMessage).catch(console.error);
        break;
        
      case 'disconnected':
        elements.status.textContent = 'Disconnected';
        elements.status.classList.add('status-disconnected');
        elements.placeholder.classList.remove('hidden');
        elements.speakingIndicator.classList.add('hidden');
        elements.connectBtn.disabled = false;
        elements.disconnectBtn.disabled = true;
        elements.interruptBtn.disabled = true;
        elements.userInput.disabled = true;
        elements.sendBtn.disabled = true;
        hideLoading();
        break;
    }
  }

  /**
   * Speaking state handler
   */
  function handleSpeakingChange(isSpeaking) {
    if (isSpeaking) {
      elements.speakingIndicator.classList.remove('hidden');
    } else {
      elements.speakingIndicator.classList.add('hidden');
    }
  }

  /**
   * Error handler
   */
  function handleError(error) {
    console.error('HeyGen Error:', error);
    addMessage('system', `Connection error: ${error.message}. Please try again.`);
    hideLoading();
  }

  /**
   * Show loading overlay
   */
  function showLoading(text = 'Connecting to Dr Drewery...') {
    elements.loadingText.textContent = text;
    elements.loadingOverlay.classList.remove('hidden');
  }

  /**
   * Hide loading overlay
   */
  function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
  }

  /**
   * Add message to chat
   */
  function addMessage(type, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    // Format the text with line breaks
    const formattedText = text.split('\n').map(line => 
      `<p>${escapeHtml(line)}</p>`
    ).join('');
    
    messageDiv.innerHTML = formattedText;
    elements.chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Generate mentor response
   * 
   * TODO: In production, replace this with Azure OpenAI call
   * that uses the Dr Drewery persona and RAG knowledge base
   */
  function generateMentorResponse(userMessage) {
    // Placeholder responses - replace with actual LLM integration
    const responses = [
      "That's a great question about your research. Let me ask you this - what do you think are the key variables you need to consider?",
      "Interesting approach! Have you looked at how the falling particle receiver systems handle similar challenges? The CSIRO research at Newcastle might give you some insights.",
      "I appreciate you thinking through this carefully. Before I share my thoughts, what experiments have you considered to test your hypothesis?",
      "Good progress! Remember, in concentrated solar thermal research, we always need to balance efficiency with practical implementation. What trade-offs are you seeing?",
      "That reminds me of some work we did with the ASTRI collaboration. Have you reviewed the thermal storage data from those trials?",
      "Excellent thinking! The key with thermal energy storage is understanding the heat transfer mechanisms. What's your current model predicting?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Send message handler
   */
  async function sendMessage() {
    const text = elements.userInput.value.trim();
    
    if (!text || !heygenClient.isConnected() || isProcessing) return;

    isProcessing = true;
    
    // Clear input
    elements.userInput.value = '';
    
    // Add user message to chat
    addMessage('user', text);
    
    // Disable input while processing
    elements.userInput.disabled = true;
    elements.sendBtn.disabled = true;

    try {
      // Generate response (TODO: Replace with Azure OpenAI)
      const response = generateMentorResponse(text);
      
      // Add avatar response to chat
      addMessage('avatar', response);
      
      // Send to avatar to speak
      await heygenClient.speak(response);
      
    } catch (error) {
      console.error('Send message error:', error);
      addMessage('system', 'Failed to send message. Please try again.');
    } finally {
      isProcessing = false;
      elements.userInput.disabled = false;
      elements.sendBtn.disabled = false;
      elements.userInput.focus();
    }
  }

  // Event Listeners

  // Connect button
  elements.connectBtn.addEventListener('click', async () => {
    showLoading('Connecting to Dr Drewery...');
    elements.connectBtn.disabled = true;
    
    const success = await heygenClient.connect();
    
    if (!success) {
      elements.connectBtn.disabled = false;
      addMessage('system', 'Failed to connect. Please check your connection and try again.');
    }
  });

  // Disconnect button
  elements.disconnectBtn.addEventListener('click', async () => {
    showLoading('Disconnecting...');
    await heygenClient.disconnect();
    addMessage('system', 'Session ended. Click Connect to start a new mentoring session.');
  });

  // Interrupt button
  elements.interruptBtn.addEventListener('click', async () => {
    await heygenClient.interrupt();
  });

  // Send button
  elements.sendBtn.addEventListener('click', sendMessage);

  // Enter key to send (Shift+Enter for new line)
  elements.userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  elements.userInput.addEventListener('input', () => {
    elements.userInput.style.height = 'auto';
    elements.userInput.style.height = Math.min(elements.userInput.scrollHeight, 120) + 'px';
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (heygenClient.isConnected()) {
      heygenClient.disconnect();
    }
  });

  // Handle visibility change (pause when tab hidden)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && heygenClient.isConnected()) {
      console.log('Tab hidden, connection maintained');
    }
  });

  console.log('Dr Geoff Drewery Mentor Avatar initialized');
});
