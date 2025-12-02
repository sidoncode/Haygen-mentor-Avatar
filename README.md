# Dr Geoff Drewery - CSIRO Mentor Avatar

A real-time streaming avatar mentor for CSIRO research students, powered by HeyGen and deployed on Azure App Service.

## 🎯 Features

- **Real-time Avatar Streaming**: Live video/audio avatar using HeyGen's WebRTC streaming
- **Chat Interface**: Text-based interaction with the mentor avatar
- **CSIRO Branding**: Professional UI styled for CSIRO research environment
- **Azure Ready**: Configured for deployment on Azure App Service

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- HeyGen API account with:
  - API Key
  - Custom Avatar ID
  - Custom Voice ID

### Local Development

1. **Clone and install:**
   ```bash
   cd heygen-mentor-avatar
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your HeyGen credentials
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   ```
   http://localhost:8080
   ```

## ☁️ Deploy to Azure

### Option 1: Azure Portal

1. Create a new Web App in Azure Portal
2. Select Node 18 LTS runtime
3. Enable WebSockets in Configuration → General Settings
4. Add environment variables in Configuration → Application Settings:
   - `HEYGEN_API_KEY`
   - `HEYGEN_AVATAR_ID`
   - `HEYGEN_VOICE_ID`
5. Deploy via GitHub Actions or ZIP deploy

### Option 2: Azure CLI

```bash
# Login
az login

# Create resource group
az group create --name csiro-mentor-rg --location australiaeast

# Create App Service plan
az appservice plan create \
  --name csiro-mentor-plan \
  --resource-group csiro-mentor-rg \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --name csiro-mentor-avatar \
  --resource-group csiro-mentor-rg \
  --plan csiro-mentor-plan \
  --runtime "NODE:18-lts"

# Configure environment variables
az webapp config appsettings set \
  --name csiro-mentor-avatar \
  --resource-group csiro-mentor-rg \
  --settings \
    HEYGEN_API_KEY="your_key" \
    HEYGEN_AVATAR_ID="your_avatar_id" \
    HEYGEN_VOICE_ID="your_voice_id"

# Enable WebSockets
az webapp config set \
  --name csiro-mentor-avatar \
  --resource-group csiro-mentor-rg \
  --web-sockets-enabled true

# Deploy
zip -r deploy.zip . -x "node_modules/*" -x ".env" -x ".git/*"
az webapp deployment source config-zip \
  --name csiro-mentor-avatar \
  --resource-group csiro-mentor-rg \
  --src deploy.zip
```

## 📁 Project Structure

```
heygen-mentor-avatar/
├── server/
│   ├── index.js              # Express server
│   ├── routes/
│   │   └── heygen.js         # HeyGen API routes
│   └── services/
│       └── heygenService.js  # HeyGen streaming logic
├── client/
│   ├── index.html            # Main page
│   ├── css/
│   │   └── styles.css        # Styling
│   └── js/
│       ├── app.js            # Main app logic
│       └── heygenStream.js   # WebRTC handler
├── package.json
├── web.config                # Azure IIS config
└── .env.example              # Environment template
```

## 🔧 Configuration

| Variable | Description |
|----------|-------------|
| `HEYGEN_API_KEY` | Your HeyGen API key |
| `HEYGEN_AVATAR_ID` | Custom avatar ID from HeyGen |
| `HEYGEN_VOICE_ID` | Custom voice ID from HeyGen |
| `PORT` | Server port (default: 8080) |

## 🔜 Next Steps

After basic deployment:

1. **Add Azure Speech-to-Text** for voice input
2. **Integrate Azure OpenAI** for LLM responses with Dr Drewery persona
3. **Add RAG with Azure AI Search** for CSIRO document knowledge
4. **Implement Mem0** for long-term student memory
5. **Add Azure AD authentication** for secure access

## 📚 Resources

- [HeyGen API Docs](https://docs.heygen.com/)
- [Azure App Service Docs](https://docs.microsoft.com/azure/app-service/)
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

## 📄 License

CSIRO Internal Use

---

**Dr Geoff Drewery** - CST Research Mentor  
*CSIRO Energy Business Unit*
