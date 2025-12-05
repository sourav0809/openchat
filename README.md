# OpenChat

**An AI-powered chat application with real-time streaming responses, multi-session management, and specialized tools for weather, stocks, and Formula 1 information.**

🔗 **Live Demo**: [https://openchat.itssourav.online/](https://openchat.itssourav.online/)

---

## ✨ Features

- 🔐 **OAuth Authentication** - GitHub and Google login
- 💬 **Real-time AI Chat** - Streaming responses with GPT-4 or Gemini
- 📝 **Multiple Chat Sessions** - Organize conversations separately
- 💾 **Persistent History** - All conversations saved to database
- ⏹️ **Stop Streaming** - Cancel AI responses mid-generation
- 🌤️ **Weather Tool** - Get real-time weather information for any city
- 📈 **Stock Price Tool** - Live stock market data and prices
- 🏎️ **F1 Tool** - Formula 1 race schedules and information
- 📱 **Responsive Design** - Works on desktop and mobile
- 🎨 **Modern UI** - Clean interface with Tailwind CSS

---

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/openchat.git
cd openchat
npm install
```

### 2. Environment Variables Setup

Create a `.env` file in the root directory with the following variables:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database

# NextAuth (Generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# GitHub OAuth (https://github.com/settings/developers)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Google OAuth (https://console.cloud.google.com/)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI Provider (Choose GEMINI or OPENAI)
LLM_PROVIDER=GEMINI
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
# OR use OpenAI
# OPENAI_API_KEY=sk-your-openai-key

# External APIs
OPENWEATHER_API_KEY=your-openweather-key
ALPHAVANTAGE_API_KEY=your-alphavantage-key
```

### 3. Database Setup with Neon

1. **Create a Neon Database**:

   - Go to [https://neon.tech/](https://neon.tech/)
   - Sign up for a free account
   - Create a new project
   - Copy the connection string

2. **Add to `.env`**:

   ```env
   DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

3. **Push Database Schema** (using Drizzle ORM):

   ```bash
   npm run db:push
   ```

4. **(Optional) View Database**:
   ```bash
   npm run db:studio
   ```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Getting API Keys

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set callback URL: `http://localhost:3000/api/auth/callback/github`

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add redirect URI: `http://localhost:3000/api/auth/callback/google`

### AI Provider

- **Gemini**: [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
- **OpenAI**: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### External APIs

- **OpenWeather**: [https://openweathermap.org/api](https://openweathermap.org/api)
- **Alpha Vantage**: [https://www.alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key)

---

## 🛠 Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: Neon PostgreSQL, Drizzle ORM
- **AI**: OpenAI GPT-4 / Google Gemini, Vercel AI SDK
- **Tools**: Weather API, Stock API, F1 API

---

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema to database
npm run db:generate  # Generate migrations
npm run db:studio    # Open database GUI
```

---

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

---

Made with ❤️ using Next.js
