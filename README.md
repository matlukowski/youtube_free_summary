# YouTube Transcript Downloader with AI

A modern web application built with the [T3 Stack](https://create.t3.gg/) for downloading and managing YouTube video transcripts with AI-powered analysis. Extract, save, organize transcripts and interact with them using local AI models via Ollama.

## ✨ Features

### Core Features
- **🎬 YouTube Integration**: Extract transcripts from any YouTube video with available subtitles
- **📺 YouTube Player**: Embedded video player with custom controls
- **💾 Persistent Storage**: Save transcripts to LibSQL/Turso database with full history
- **📋 Copy to Clipboard**: One-click copying of transcripts
- **🔍 Search History**: Search through previously downloaded transcripts
- **🌓 Dark Mode**: Beautiful dark/light theme support
- **📱 Responsive Design**: Works seamlessly on desktop and mobile
- **⚡ Real-time Updates**: Live loading states and error handling
- **🗑️ Transcript Management**: Delete unwanted transcripts from history

### AI-Powered Features ✨
- **🤖 AI Summaries**: Generate intelligent summaries using local LLM models
- **💬 Interactive Chat**: Ask questions about video content and get contextual answers
- **🎨 Multiple Summary Styles**: Choose from concise, detailed, or bullet-point summaries
- **🌍 Multi-language Support**: AI responses in Polish and English
- **🔒 Privacy-First**: All AI processing happens locally via Ollama
- **🏷️ Smart Categorization**: Organize content with AI-generated insights

## 🛠️ Tech Stack

### Core Technologies
- **Framework**: [Next.js 15](https://nextjs.org) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Database**: [LibSQL/Turso](https://turso.tech) with [Prisma ORM](https://prisma.io)
- **API**: [tRPC](https://trpc.io) for type-safe API calls

### AI & Media
- **AI Engine**: [Ollama](https://ollama.com) for local LLM inference
- **Video Player**: [React YouTube](https://github.com/tjallingt/react-youtube)
- **YouTube Processing**: [yt-dlp](https://github.com/yt-dlp/yt-dlp)

### UI & UX
- **Icons**: [Lucide React](https://lucide.dev)
- **Notifications**: [React Hot Toast](https://react-hot-toast.com)
- **Date Handling**: [date-fns](https://date-fns.org)

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **yt-dlp** for YouTube transcript extraction
- **Ollama** for AI features (optional but recommended)
- **Turso account** for database hosting (or use local SQLite)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd youtube-summary
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install yt-dlp**
   ```bash
   # Run the interactive installer
   node scripts/install-yt-dlp.mjs

   # Or install manually based on your OS:

   # macOS (with Homebrew)
   brew install yt-dlp

   # Linux (with pip)
   pip3 install yt-dlp

   # Windows (with Chocolatey)
   choco install yt-dlp
   ```

4. **Install Ollama (for AI features)**
   ```bash
   # Run the automated installer
   npm run install-ollama

   # Or install manually:

   # macOS/Linux
   curl -fsSL https://ollama.com/install.sh | sh

   # Windows
   # Download installer from https://ollama.com/download/windows
   ```

   After installation, start Ollama and pull a model:
   ```bash
   # Start Ollama service
   ollama serve

   # Pull recommended model (in a new terminal)
   ollama pull qwen2.5:7b
   ```

5. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Update your `.env` file with the following configurations:
   ```env
   # Database (use SQLite for local development)
   DATABASE_URL="file:./dev.db"
   DATABASE_AUTH_TOKEN=""

   # Ollama Configuration (for AI features)
   OLLAMA_HOST="http://localhost:11434"
   OLLAMA_MODEL="qwen2.5:7b"

   # NextAuth (generate a secret key)
   AUTH_SECRET="your-auth-secret-here"
   ```

6. **Configure Database**

   For **Local Development** (recommended):
   ```bash
   # Uses SQLite - no additional setup needed
   npm run db:push
   ```

   For **Production with Turso**:
   ```bash
   # Install Turso CLI
   curl -sSfL https://get.tur.so/install.sh | bash

   # Create database
   turso db create youtube-transcripts

   # Get database URL and auth token
   turso db show youtube-transcripts
   turso auth tokens create
   ```

   Update your `.env` file with Turso credentials:
   ```env
   DATABASE_URL="libsql://your-database-name.turso.io"
   DATABASE_AUTH_TOKEN="your-database-auth-token"
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

### Basic Transcript Features
1. **Enter YouTube URL**: Paste any YouTube video URL into the input field
2. **Select Language**: Choose your preferred language (English/Polish) for AI responses
3. **Download Transcript**: Click "Get Transcript" to extract and save the transcript
4. **Watch Video**: View the embedded YouTube player alongside the transcript
5. **Browse Tabs**: Switch between Full Transcript, AI Summary, and AI Chat tabs
6. **Copy Text**: Use the "Copy" button to copy content to your clipboard
7. **Browse History**: View and search through previously downloaded transcripts

### AI-Powered Features 🤖
8. **Generate Summaries**:
   - Choose from Concise, Detailed, or Bullet Points styles
   - Summaries are generated in your selected language
   - One-click regeneration of summaries

9. **Interactive Chat**:
   - Ask questions about the video content
   - Get contextual answers based on the transcript
   - Chat history is saved and persistent
   - Clear conversation history when needed

10. **Language Support**:
    - Switch between English and Polish for AI responses
    - AI will respond in your chosen language regardless of video language

### Supported YouTube URL Formats

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://youtube.com/embed/VIDEO_ID`
- `https://m.youtube.com/watch?v=VIDEO_ID`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | Database connection URL | ✅ | `file:./dev.db` |
| `DATABASE_AUTH_TOKEN` | Database authentication token | For Turso only | - |
| `AUTH_SECRET` | NextAuth.js secret key | ✅ | - |
| `OLLAMA_HOST` | Ollama server URL | For AI features | `http://localhost:11434` |
| `OLLAMA_MODEL` | Default AI model | For AI features | `qwen2.5:7b` |
| `NODE_ENV` | Environment mode | Auto-detected | `development` |

### Database Schema

The application uses the following database models:

```prisma
model Transcript {
  id          String   @id @default(cuid())
  youtubeUrl  String
  videoTitle  String?
  transcript  String
  language    String?
  createdAt   DateTime @default(now())

  // Relations
  summary      TranscriptSummary?
  chatMessages ChatMessage[]
}

model TranscriptSummary {
  id           String   @id @default(cuid())
  transcriptId String   @unique
  summary      String
  model        String   // AI model used
  createdAt    DateTime @default(now())

  transcript Transcript @relation(fields: [transcriptId], references: [id], onDelete: Cascade)
}

model ChatMessage {
  id           String   @id @default(cuid())
  transcriptId String
  role         String   // "user" or "assistant"
  message      String
  model        String?  // AI model used (for assistant messages)
  createdAt    DateTime @default(now())

  transcript Transcript @relation(fields: [transcriptId], references: [id], onDelete: Cascade)
}
```

## 🧩 API Endpoints

The application provides the following tRPC endpoints:

### Core Transcript Endpoints
- `transcript.fetchTranscript` - Download transcript from YouTube URL
- `transcript.getHistory` - Retrieve transcript history with pagination
- `transcript.getById` - Get full transcript by ID
- `transcript.delete` - Delete transcript from database

### AI-Powered Endpoints 🤖
- `transcript.generateSummary` - Generate AI summary with style options
- `transcript.getSummary` - Retrieve existing summary for a transcript
- `transcript.deleteSummary` - Delete summary to allow regeneration
- `transcript.chatWithTranscript` - Send chat message and get AI response
- `transcript.getChatHistory` - Retrieve chat history for a transcript
- `transcript.clearChatHistory` - Clear all chat messages for a transcript

### System Status Endpoints
- `transcript.checkYtDlp` - Verify yt-dlp installation status
- `transcript.checkOllama` - Verify Ollama availability for AI features

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Installation & Setup
npm run install-ollama  # Install and setup Ollama for AI features

# Database
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Prisma Studio
npm run db:generate  # Generate Prisma client

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run typecheck    # Run TypeScript checks
npm run format:check # Check code formatting
npm run format:write # Format code with Prettier
```

### Project Structure

```
src/
├── app/
│   ├── _components/            # React components
│   │   ├── LanguageSwitcher.tsx    # Language toggle component
│   │   ├── LoadingSpinner.tsx      # Loading animations
│   │   ├── TranscriptChat.tsx      # AI chat interface
│   │   ├── TranscriptDisplay.tsx   # Transcript content display
│   │   ├── TranscriptForm.tsx      # URL input form
│   │   ├── TranscriptHistory.tsx   # History sidebar
│   │   ├── TranscriptTabs.tsx      # Tab navigation wrapper
│   │   └── YouTubePlayer.tsx       # Embedded video player
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── server/
│   ├── api/
│   │   ├── routers/
│   │   │   └── transcript.ts   # Main API router with AI endpoints
│   │   ├── root.ts             # API root
│   │   └── trpc.ts             # tRPC setup
│   ├── utils/
│   │   ├── ollama.ts           # Ollama/AI integration
│   │   └── youtube.ts          # YouTube/yt-dlp integration
│   └── db.ts                   # Database client
├── trpc/                       # tRPC client setup
├── scripts/
│   └── install-ollama.mjs      # Automated Ollama setup
└── env.js                      # Environment validation
```

## 🚀 Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push to main branch

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Important Notes

- Ensure yt-dlp is available on your deployment environment
- For serverless deployments, consider using a container-based approach
- Set up proper error monitoring for production

## ⚠️ Troubleshooting

### Common Issues

**yt-dlp not found**
- Run `node scripts/install-yt-dlp.mjs` for installation help
- Verify yt-dlp is in your system PATH
- Try installing via pip: `pip3 install yt-dlp`

**Ollama/AI features not working**
- Run `npm run install-ollama` for automated setup
- Verify Ollama is running: `ollama list`
- Check if model is installed: `ollama pull qwen2.5:7b`
- Ensure OLLAMA_HOST is correctly configured in `.env`
- Try restarting Ollama service: `ollama serve`

**Database connection issues**
- Verify your database credentials in `.env`
- For local development, ensure SQLite file permissions
- For Turso, check if database URL is accessible
- Run `npm run db:push` to sync schema

**Transcript not available**
- Not all YouTube videos have transcripts
- Some videos may have transcripts disabled
- Try with a different video that has captions
- Check video privacy settings

**Permission errors**
- Some videos may be region-restricted
- Private/unlisted videos won't work
- Age-restricted content may have limitations
- Corporate firewalls may block YouTube access

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions:
- Check the [troubleshooting section](#-troubleshooting)
- Open an issue on GitHub
- Review [yt-dlp documentation](https://github.com/yt-dlp/yt-dlp) for YouTube-related issues

---

Built with ❤️ using the [T3 Stack](https://create.t3.gg/)
