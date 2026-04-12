# Deployment Configuration Summary

## ✅ Changes Made

### Frontend Updates

1. **Created `src/lib/apiClient.js`** - Centralized API configuration
   - `getApiBaseUrl()` - Returns VITE_API_BASE_URL or localhost fallback
   - URL builders for each API endpoint: auth, interviews, questions, review, transcribe, realTime, run

2. **Updated `vite.config.js`**
   - Proxy target now uses `VITE_API_TARGET` environment variable
   - Falls back to localhost:3001 for development

3. **Updated all page components to use apiClient**
   - `src/pages/LoginPage.jsx` - Uses `makeAuthUrl()`
   - `src/pages/InterviewSessionPage.jsx` - Uses all URL builders
   - `src/pages/OldInterviewsPage.jsx` - Uses `makeInterviewUrl()`
   - `src/pages/ReportPage.jsx` - Uses `makeInterviewUrl()` and `makeQuestionUrl()`

4. **Updated `src/lib/AppStateContext.jsx`**
   - Uses `makeQuestionUrl()` and `makeInterviewUrl()` for API calls

### Backend Updates

1. **Updated `server/index.js`**
   - CORS origin now reads from `FRONTEND_URL` environment variable
   - Falls back to localhost:5173, 5174, 5175 for development
   - Server logs now show port number without hardcoded localhost

### Environment Files Created

1. **Frontend**
   - `.env.local` - Local development configuration
   - `.env.example` - Template for Vercel deployment

2. **Backend**
   - `server/.env` - Local development configuration
   - `server/.env.example` - Template for Render deployment

### Documentation

1. **`DEPLOYMENT.md`** - Complete deployment guide including:
   - MongoDB Atlas setup
   - Render backend deployment
   - Vercel frontend deployment
   - Local development setup
   - Environment variable reference
   - Troubleshooting guide
   - Deployment checklist

---

## 📋 Environment Variables Summary

### Vercel (Frontend)

```
VITE_API_BASE_URL=https://your-backend.onrender.com/api
```

### Render (Backend)

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/stdout?retryWrites=true&w=majority
JWT_SECRET=<strong-random-string>
OPENAI_API_KEY=sk-<your-key>
FRONTEND_URL=https://your-frontend.vercel.app
PORT=<auto-set-by-render>
```

---

## 🚀 Ready for Deployment

**Frontend**: Push to GitHub → Auto-deploy to Vercel

- Configure `VITE_API_BASE_URL` in Vercel environment variables
- Build command: `npm run build`

**Backend**: Push to GitHub → Auto-deploy to Render

- Configure all env variables in Render dashboard
- Start command: `node server/index.js`

---

## 🔄 Local Development

Frontend + Backend:

```bash
npm run dev  # Runs vite + server concurrently
```

---

## ⚠️ Notes

- `.env` and `.env.local` are already in `.gitignore` - they won't be committed
- All hardcoded localhost:3001 URLs have been removed (except as fallbacks)
- CORS is dynamic and reads from environment variables
- API client is centralized for easy maintenance and consistency
