# Deployment Guide - Fuel EU Maritime Platform

## Quick Start

This guide covers deploying both backend and frontend to Render.

## Prerequisites

- ✅ GitHub account with repository access
- ✅ Render account (free tier works)
- ✅ PostgreSQL database (Render provides free tier)

## Backend Deployment (Node.js + PostgreSQL)

### Step 1: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name**: `carbon-system-db`
   - **Region**: Choose closest to your users
   - **Instance Type**: Free
4. Click "Create Database"
5. **Save the connection details** (you'll need them)

### Step 2: Deploy Backend Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `carbon-system-backend`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `Backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run prisma:generate && npm run build`
   - **Start Command**: `npm run prisma:migrate && npm start`
   - **Instance Type**: Free

4. **Add Environment Variables**:
   ```
   DATABASE_URL=<your-postgres-internal-url>
   NODE_ENV=production
   PORT=3000
   ```

5. Click "Create Web Service"

6. **Wait for deployment** (first deploy takes ~5-10 minutes)

7. **Test backend**: Visit `https://your-backend.onrender.com/health`
   - Should return: `{"status":"ok"}`

### Step 3: Seed Database

After first successful deployment:

```bash
# Option 1: Use Render Shell
# Go to your backend service → Shell tab
npm run seed

# Option 2: Via local terminal
# Set DATABASE_URL to your Render Postgres external URL
export DATABASE_URL="<your-external-db-url>"
npm run seed
```

## Frontend Deployment (Next.js)

### Step 1: Get Backend URL

From your backend service, copy the URL:
- Example: `https://carbon-system-backend.onrender.com`

### Step 2: Deploy Frontend Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `carbon-system-frontend`
   - **Region**: Same as backend (for better latency)
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

4. **Add Environment Variables**:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://carbon-system-backend.onrender.com
   NODE_ENV=production
   ```

5. Click "Create Web Service"

6. **Wait for deployment** (~5-10 minutes)

7. **Test frontend**: Visit `https://your-frontend.onrender.com`
   - Should show the dashboard and floating dock
   - Navigate to Routes tab to test API connection

## Post-Deployment Checklist

### Backend ✅
- [ ] Service status is "Live"
- [ ] Health check returns `{"status":"ok"}`
- [ ] Database is connected (no connection errors in logs)
- [ ] Database is seeded with 5 routes
- [ ] CORS is enabled for frontend domain

### Frontend ✅
- [ ] Service status is "Live"
- [ ] Dashboard loads without errors
- [ ] Routes tab displays data from backend
- [ ] Toast notifications work on API calls
- [ ] All 4 tabs are functional

## Troubleshooting

### Backend Issues

**Problem**: "Error: P1001 Can't reach database server"

**Solution**:
- Verify `DATABASE_URL` is set correctly
- Use the **Internal Database URL** from Render PostgreSQL
- Restart the service after updating env vars

**Problem**: "CORS error" in browser console

**Solution**:
- Backend CORS is configured to allow all origins (`origin: "*"`)
- For production, update `Backend/src/infrastructure/server/expressApp.ts`:
  ```typescript
  app.use(cors({
    origin: ["https://your-frontend.onrender.com"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));
  ```

**Problem**: Routes not seeded

**Solution**:
```bash
# Connect to Render Shell and run:
npm run seed
```

### Frontend Issues

**Problem**: "Failed to load routes" or API errors

**Solution**:
- Verify `NEXT_PUBLIC_API_BASE_URL` is set in Render
- Check it points to your backend URL (no trailing slash)
- Test backend health endpoint directly

**Problem**: Environment variable not updating

**Solution**:
1. Update env var in Render dashboard
2. Click "Manual Deploy" → "Clear build cache & deploy"

**Problem**: Build fails with "EPERM" or permission errors

**Solution**:
- This is normal on first build
- Wait for automatic retry or manually trigger redeploy

## Monitoring

### Logs

**Backend logs**:
```bash
# View in Render Dashboard
Your Service → Logs tab
```

**Frontend logs**:
```bash
# View in Render Dashboard
Your Service → Logs tab
```

### Health Checks

**Backend**:
- Endpoint: `GET /health`
- Expected: `{"status":"ok"}`

**Frontend**:
- Just visit the URL
- Should load without errors

## Scaling

### Free Tier Limitations

- **Backend**: 512 MB RAM, spins down after 15 min inactivity
- **Frontend**: 512 MB RAM, spins down after 15 min inactivity
- **Database**: 1 GB storage, 97 connection limit

### Upgrade Options

For production use, consider:
- **Starter Plan** ($7/month per service): No spin-down, faster
- **Professional Plan** ($25/month): Auto-scaling, metrics

## Custom Domains

1. Go to service settings
2. Click "Add Custom Domain"
3. Follow DNS configuration instructions

## Environment Variables Reference

### Backend
```env
DATABASE_URL=<postgres-internal-url>
NODE_ENV=production
PORT=3000
```

### Frontend
```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com
NODE_ENV=production
```

## Maintenance

### Updating Code

1. Push changes to GitHub `main` branch
2. Render auto-deploys (if enabled)
3. Or manually trigger: Dashboard → Manual Deploy

### Database Migrations

When schema changes:
```bash
# Backend service will auto-run migrations on start
# Or manually in Render Shell:
npm run prisma:migrate
```

### Backup Database

```bash
# From local terminal with external DB URL
export DATABASE_URL="<external-url>"
pg_dump $DATABASE_URL > backup.sql
```

## Support

- **Render Docs**: https://render.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs

## URLs Summary

After deployment, you'll have:

| Service | URL |
|---------|-----|
| Backend API | `https://carbon-system-backend.onrender.com` |
| Frontend App | `https://carbon-system-frontend.onrender.com` |
| Database | Internal URL (for backend only) |
| Health Check | `https://carbon-system-backend.onrender.com/health` |

🎉 **Your Fuel EU Maritime Compliance Platform is now live!**

