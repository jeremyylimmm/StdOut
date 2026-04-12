# StdOut - Deployment Guide

This guide covers deploying the StdOut application with:

- **Frontend**: Vercel
- **Backend API**: Render
- **Database**: MongoDB Atlas

## Prerequisites

- MongoDB Atlas account and a cluster created
- OpenAI API key
- Vercel account
- Render account

---

## 1. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster (free tier available)
3. Create a database user with a strong password
4. Whitelist IP addresses (or allow 0.0.0.0/0 for testing)
5. Copy the connection string: `mongodb+srv://username:password@cluster.mongodb.net/stdout?retryWrites=true&w=majority`

---

## 2. Backend Deployment (Render)

### Step 1: Prepare Environment Variables

The backend uses these environment variables:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/stdout?retryWrites=true&w=majority
JWT_SECRET=<generate-a-strong-random-string>
OPENAI_API_KEY=sk-<your-openai-key>
FRONTEND_URL=https://your-frontend.vercel.app
PORT=3001  # Render sets this automatically
```

### Step 2: Connect Render

1. Go to [Render.com](https://render.com)
2. Connect your GitHub repository
3. Create a new **Web Service**
4. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Environment Variables**: Add all variables from the `.env.example` file

### Step 3: Deploy

1. Click "Deploy"
2. Render will automatically deploy when you push to main
3. Copy your Render URL (e.g., `https://stdout-backend.onrender.com`)

---

## 3. Frontend Deployment (Vercel)

The frontend uses this environment variable:

```
VITE_API_BASE_URL=https://stdout-backend.onrender.com/api
```

### Step 1: Connect Vercel

1. Go to [Vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Vite (should auto-detect)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 2: Set Environment Variables

In Vercel project settings:

1. Go to **Settings > Environment Variables**
2. Add: `VITE_API_BASE_URL = https://stdout-backend.onrender.com/api`
   - Select environments: Production, Preview, Development

### Step 3: Deploy

1. Click "Deploy"
2. Vercel will automatically deploy when you push to main

---

## 4. Running Locally

### Frontend

```bash
# Create .env.local in project root
VITE_API_BASE_URL=http://localhost:3001/api
VITE_API_TARGET=http://localhost:3001

# Start frontend + backend concurrently
npm run dev
```

### Backend Only

```bash
cd server

# Create .env file with local MongoDB
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/stdout
JWT_SECRET=dev-secret
OPENAI_API_KEY=sk-your-key
FRONTEND_URL=http://localhost:5173

node index.js
```

---

## 5. Environment Variable Reference

### Frontend (.env.local)

- `VITE_API_BASE_URL`: Base URL for API calls (e.g., `http://localhost:3001/api`)
- `VITE_API_TARGET`: Vite proxy target for local dev

### Backend (.env)

- `NODE_ENV`: Set to `production` on Render
- `MONGODB_URI`: MongoDB Atlas connection string
- `JWT_SECRET`: Secret key for JWT tokens (generate a strong random string)
- `OPENAI_API_KEY`: Your OpenAI API key
- `FRONTEND_URL`: Frontend URL for CORS (e.g., `https://your-app.vercel.app`)
- `PORT`: Server port (Render sets this automatically)

---

## 6. Troubleshooting

### CORS Errors

- Ensure `FRONTEND_URL` matches your Vercel domain exactly
- In local dev, the backend CORS allows `http://localhost:5173`

### Database Connection Errors

- Verify MongoDB Atlas IP whitelist includes Render's IP
- Check connection string format: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`

### API Calls Failing

- Frontend: Check that `VITE_API_BASE_URL` matches your Render backend URL
- Backend: Ensure CORS `FRONTEND_URL` matches your Vercel domain

### Image/Asset Loading Issues

- Ensure Vercel build command is `npm run build`
- Check that dist folder contains all assets

---

## 7. Deployment Checklist

- [ ] MongoDB Atlas cluster created and connection string obtained
- [ ] OpenAI API key generated
- [ ] Backend `.env` file configured with all variables
- [ ] Render deployment configured with correct build/start commands
- [ ] Backend URL copied from Render (e.g., `https://app.onrender.com`)
- [ ] Frontend `VITE_API_BASE_URL` set to backend URL on Vercel
- [ ] Frontend deployed successfully
- [ ] Test login/signup works
- [ ] Test API calls complete successfully

---

## 8. Production Notes

- Always use strong, unique `JWT_SECRET` on production
- Keep `OPENAI_API_KEY` secure and rotate regularly
- Monitor MongoDB usage and adjust cluster tier if needed
- Set up error tracking/monitoring for both services
- Enable auto-restart on both Render and consider health checks
