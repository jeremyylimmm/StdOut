# 🎯 StdOut - Technical Interview Simulator

A cutting-edge web platform that simulates realistic technical interviews with real-time AI conversation, live code execution, and intelligent performance analytics. Practice coding interviews anytime, anywhere with feedback from an AI-powered senior engineer.

---

## 🌐 Live Demo

**[🚀 Try StdOut Now](https://your-deployed-url-here.vercel.app)**

*Deployed on Vercel (Frontend) + Render (Backend) + MongoDB Atlas (Database)*

---

## 🌟 Key Features

### 🤖 Real-Time AI Conversation

- **Live speech-to-text transcription** using your microphone
- **AI interviewer with GPT-4o Realtime API** that conducts natural conversations
- **Neutral, non-intrusive AI** that follows professional interview protocols
- Evaluates your thinking process and communication skills

### 💻 Integrated Code Editor

- **Live code editor** with Python syntax highlighting
- **Instant code execution** directly in the browser
- **Real-time diff timeline** tracking every code change during the session
- Visual history of your coding approach and iterations

### 📊 Intelligent Evaluation Metrics

- **Automatic test case validation** for coding problems
- **AI-powered performance review** analyzing:
  - Code quality and correctness
  - Communication and explanation clarity
  - Problem-solving approach
  - Time management
- **Detailed session reports** with scores and feedback

### 📚 Question Bank

- **Coding problems** from top companies (Google, Amazon, Meta, etc.)
- **Theory/discussion questions** for behavioral interviews
- **Difficulty levels** (Easy, Medium, Hard)
- **Categorized by company and topic**

### 📈 Interview History

- **Complete session management** - review past interviews
- **Progress tracking** - see your improvement over time
- **Code replay** - review your exact code and timestamps
- **Performance comparisons** - track metrics across sessions

---

## 🛠️ Tech Stack

### Frontend

- **React 19** - Modern UI framework with hooks
- **Vite** - Lightning-fast build tool
- **React Router** - Client-side routing
- **CodeMirror** - Advanced code editor component
- **Three.js + Postprocessing** - Visual effects and animations

### Backend

- **Node.js + Express** - Fast, scalable server
- **MongoDB + Mongoose** - Database and ODM
- **JWT** - Secure authentication
- **OpenAI API** - Real-time conversation and analysis

### Deployment

- **Vercel** - Frontend hosting
- **Render** - Backend API hosting
- **MongoDB Atlas** - Cloud database

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- OpenAI API key

### Local Development

1. **Clone and install:**

```bash
git clone https://github.com/yourusername/StdOut.git
cd StdOut
npm install
cd server && npm install && cd ..
```

2. **Configure environment variables:**

Create `.env.local` in the project root:

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_API_TARGET=http://localhost:3001
```

Create `server/.env`:

```env
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/stdout
JWT_SECRET=dev-secret-key
OPENAI_API_KEY=sk-your-openai-key
FRONTEND_URL=http://localhost:5173
PORT=3001
```

3. **Start the app:**

```bash
npm run dev
```

The frontend starts on `http://localhost:5173` and backend on `http://localhost:3001`.

---

## 📖 Usage

1. **Sign up/Login** - Create your account
2. **Configure Interview** - Choose:
   - Interview name
   - Question type (Coding or Theory)
   - Company (for problem selection)
   - Difficulty level
   - Duration
3. **Start Interview** - A question is randomly selected
4. **Conduct Interview** - Write code, talk through your approach
5. **Submit** - Code is tested and AI analysis is generated
6. **Review Results** - See:
   - Test case results
   - AI evaluation and feedback
   - Code diff timeline
   - Performance scores

---

## 🌐 Deployment

### Deploy to Production

The app is configured for seamless deployment:

**Frontend:** Deploy to Vercel

```bash
Set VITE_API_BASE_URL=https://your-backend.com/api in Vercel env vars
```

**Backend:** Deploy to Render

```bash
Set all env variables in Render dashboard
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

---

## 📁 Project Structure

```
StdOut/
├── src/                          # React frontend
│   ├── components/               # Reusable UI components
│   ├── pages/                    # Page components
│   ├── lib/                      # Utilities and API client
│   ├── routes/                   # Router configuration
│   └── styles/                   # CSS files
├── server/                       # Express backend
│   ├── routes/                   # API route handlers
│   ├── models/                   # MongoDB schemas
│   ├── data/                     # Question database
│   └── index.js                  # Server entry point
├── public/                       # Static assets
├── package.json                  # Dependencies
└── README.md                     # This file
```

---

## 🔑 Core APIs

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration

### Interviews

- `GET /api/interviews/user/:userId` - Get user's interviews
- `POST /api/interviews/save` - Save interview session
- `DELETE /api/interviews/:sessionId` - Delete interview

### Questions

- `GET /api/questions/random` - Get random question
- `POST /api/questions/:id/submit` - Submit code solution

### Real-Time

- `GET /api/realTime/session` - Get OpenAI session token
- `POST /api/transcribe` - Transcribe audio to text

### Code Execution

- `POST /run` - Execute Python code

---

## ✨ Features Implemented

- ✅ User authentication with JWT
- ✅ Real-time audio transcription
- ✅ Live Python code execution
- ✅ AI-powered interview conversation
- ✅ Automatic test case evaluation
- ✅ Performance analytics and scoring
- ✅ Code diff tracking with timeline
- ✅ Interview history and revisiting
- ✅ Responsive design
- ✅ Dark/light theme support
- ✅ Production-ready deployment configuration

---

## 🎓 How It Works

### Interview Flow

1. **Question Generator** - Pulls from LeetCode, theory bank, or company-specific questions
2. **Transcription** - Your speech is converted to text in real-time
3. **AI Conversation** - GPT-4o Realtime API conducts the interview neutrally
4. **Code Execution** - Your Python code runs instantly with output
5. **Evaluation** - AI reviews code quality, communication, and approach
6. **Analytics** - Scores and feedback are generated and stored

### AI Evaluation Criteria

- **Code Quality**: Correctness, efficiency, readability
- **Problem Solving**: Approach, optimizations, edge cases
- **Communication**: Explanation clarity, thought process articulation
- **Time Management**: Pacing and time awareness

---

## 🔐 Security

- Passwords hashed with bcryptjs
- JWT tokens for session management
- CORS configured for production domains
- Environment variables for sensitive data
- No credentials stored in version control

---

## 📊 Analytics & Metrics

Each interview session tracks:

- **Test Results** - Pass/fail status for each test case
- **Performance Score** - Overall assessment (0-100)
- **Communication Score** - Clarity and explanation quality
- **Code Efficiency** - Time and space complexity analysis
- **Timestamp Timeline** - Every code change timestamped

---

## 🐛 Troubleshooting

**Cannot connect to backend:**

- Ensure `server/.env` is configured correctly
- Backend must be running on the configured port
- Check CORS: `FRONTEND_URL` should match your frontend domain

**Audio transcription not working:**

- Allow microphone permissions in browser
- Check OpenAI API key is valid
- Ensure quiet environment for better accuracy

**Code execution fails:**

- Python must be installed on the backend system
- Check code for syntax errors
- Review timeout settings if complex code runs

---

## 🚦 Environment Variables

See [DEPLOYMENT_CHANGES.md](./DEPLOYMENT_CHANGES.md) for complete reference.

---

## 📝 License

This project is open source. All rights reserved for Macathon 2026.

---

## 👥 Team

Built for **Macathon 2026** - A technical interview preparation platform combining AI, real-time communication, and intelligent evaluation.

---

## 📮 Feedback & Support

Have questions? Open an issue or contact the team.

**Start practicing your interviews today with StdOut! 🚀**
