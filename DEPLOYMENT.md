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

# Deploying This Thing - A Real Guide

Alright, so you want to get this app live on the internet? I've deployed this to Render a few times now, and I'll walk you through exactly what I did. No corporate speak, just the real steps.

## What You'll Need

Before we start, make sure you have:
- A GitHub account (obviously)
- A Render account - sign up at render.com, the free tier is fine to start
- That's it! Render gives us a free PostgreSQL database too

## Part 1: Getting the Database Running

First things first - we need a place to store our data.

### Creating the PostgreSQL Database

1. Head over to [Render Dashboard](https://dashboard.render.com/)
2. Click that "New +" button → Pick "PostgreSQL"
3. Fill in the details:
   - **Name**: I called mine `fueleu-db` (you can name it whatever)
   - **Region**: Pick the one closest to where your users are. I went with Oregon since I'm on the west coast
   - **Instance Type**: Free is perfect for testing
4. Hit "Create Database"
5. **Important:** Once it's created, copy the connection strings somewhere safe. You'll need both the internal and external URLs

The database takes like 30 seconds to spin up. Pretty quick!

## Part 2: Deploying the Backend

Now let's get the Node.js backend running.

### Setting Up the Backend Service

1. Click "New +" again → This time pick "Web Service"
2. Connect your GitHub repo (you'll need to authorize Render if this is your first time)
3. Now for the configuration - this is important:
   - **Name**: `fueleu-backend` (or whatever you want)
   - **Region**: Use the SAME region as your database (trust me on this, latency matters)
   - **Branch**: `main` (or whatever your main branch is called)
   - **Root Directory**: Type `Backend` (with a capital B if that's how you named it)
   - **Runtime**: Node
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma migrate deploy && npm start`
   - **Instance Type**: Free (we can always upgrade later)

4. **Environment Variables** - Click "Add Environment Variable" and add these:
   ```
   DATABASE_URL=<paste-your-postgres-INTERNAL-url-here>
   NODE_ENV=production
   PORT=3000
   ```
   
   **Pro tip:** Use the INTERNAL database URL, not the external one. The internal one is faster and free from rate limits.

5. Click "Create Web Service" and grab a coffee ☕

The first deployment takes about 5-10 minutes. You'll see the logs streaming in real-time, which is actually pretty cool to watch.

### Testing the Backend

Once it says "Live" in green:

1. Copy your backend URL (something like `https://fueleu-backend.onrender.com`)
2. Add `/health` to the end and visit it in your browser
3. If you see `{"status":"ok"}` - congrats! It's working!

If you get errors, check the logs tab. Nine times out of ten, it's either:
- Wrong `DATABASE_URL` 
- Forgot to run migrations
- Some npm package issue (clear cache and redeploy usually fixes it)

### Seeding the Database

You need some initial data to test with:

**Option 1 - Using Render's Shell (easiest):**
1. Go to your backend service in Render
2. Click the "Shell" tab at the top
3. Type `npm run seed` and hit enter
4. Wait for it to finish (you'll see "Seeded successfully!" or something)

**Option 2 - From Your Local Machine:**
```bash
# Set the EXTERNAL database URL as an environment variable
export DATABASE_URL="your-external-postgres-url-here"
npm run seed
```

I usually use Option 1 because it's just easier.

## Part 3: Deploying the Frontend

Almost there! Now we need to get the Next.js frontend up.

### Getting Your Backend URL

Before we deploy the frontend, copy your backend URL from Render. It's something like:
```
https://fueleu-backend.onrender.com
```

**Don't add a trailing slash!** Just the base URL.

### Setting Up the Frontend Service

1. Click "New +" → "Web Service" again
2. Connect the same GitHub repo
3. Configuration time:
   - **Name**: `fueleu-frontend`
   - **Region**: Same as backend (consistency is key)
   - **Branch**: `main`
   - **Root Directory**: `frontend` (lowercase this time)
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

4. **Environment Variables** - This is crucial:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-backend-url-here.onrender.com
   NODE_ENV=production
   ```
   
   **Double-check this URL!** It needs to point to your actual backend URL from the previous step.

5. Click "Create Web Service"

This also takes 5-10 minutes. Next.js builds can be slow, especially the first time.

### Testing the Frontend

Once it's live:

1. Visit your frontend URL (something like `https://fueleu-frontend.onrender.com`)
2. You should see the dashboard with the floating dock
3. Click on the "Routes" tab
4. If you see your routes loading - YOU'RE DONE! 🎉

If nothing loads or you see errors:
- Check browser console (F12)
- Make sure `NEXT_PUBLIC_API_BASE_URL` is set correctly
- Test the backend health endpoint directly to confirm it's up

## Making Sure Everything Works

Here's my checklist for both services:

### Backend Health Check ✅
- [ ] Service shows "Live" in Render
- [ ] `/health` endpoint returns that JSON response
- [ ] Database connected (check logs for any connection errors)
- [ ] Seed data is in there (5 sample routes)
- [ ] No CORS errors in the logs

### Frontend Health Check ✅
- [ ] Service shows "Live"
- [ ] Dashboard loads without errors
- [ ] Routes tab actually shows routes from the backend
- [ ] Other tabs (Compare, Banking, Pooling) work
- [ ] No console errors (check with F12)

## When Things Go Wrong (Because They Will)

### Backend Problems I've Hit

**"Can't reach database server" error**

I got this on my first deployment. Here's the fix:
- Go back to your backend service
- Click "Environment" tab
- Make sure `DATABASE_URL` is using the INTERNAL connection string
- If you need to change it, update and click "Manual Deploy"

**CORS errors in the browser console**

The backend is configured to allow all origins by default (`origin: "*"`). If you're still getting CORS errors:
1. Check the backend logs to see what's actually happening
2. Make sure your frontend URL is correct
3. For production, you'll want to restrict CORS to just your frontend domain

**Routes not showing up**

Did you forget to seed? I did this once:
```bash
# In Render Shell (backend service):
npm run seed
```

### Frontend Problems I've Hit

**"Failed to fetch" or API errors**

Check these in order:
1. Is `NEXT_PUBLIC_API_BASE_URL` set correctly in Render?
2. Does it point to your ACTUAL backend URL?
3. No trailing slash at the end?
4. Can you hit the backend health endpoint directly?

**Environment variable not updating**

This one's annoying. When you change env vars:
1. Update the variable in Render
2. Go to "Manual Deploy"
3. Check "Clear build cache & deploy"
4. This forces a fresh build with new env vars

**Build fails with weird permission errors**

This happens sometimes on Render. Just wait a minute and it'll retry automatically. If it keeps failing, try:
- Clear build cache and redeploy
- Check your `package.json` scripts
- Look at the full error log (it's usually more helpful than the summary)

## Keeping an Eye on Things

### Checking Logs

When something's not working right, logs are your best friend.

**Backend logs:**
- Go to your backend service in Render
- Click "Logs" tab
- This shows everything - requests, errors, database queries

**Frontend logs:**
- Same deal - go to frontend service
- Click "Logs"
- You'll see build logs and runtime logs

I usually keep these open in separate tabs when I'm debugging.

### Health Monitoring

**Backend health check:**
```
GET https://your-backend.onrender.com/health
```
Should return: `{"status":"ok"}`

I sometimes set up UptimeRobot to ping this every 5 minutes and alert me if it's down.

## The Free Tier Reality Check

Render's free tier is great for testing, but you should know:

**Limitations:**
- Services spin down after 15 minutes of inactivity
- First request after sleeping takes ~30 seconds to wake up
- 512 MB RAM (usually enough, but can be tight)
- Database limited to 1 GB storage

**When to upgrade:**
- If you're getting real users, upgrade to Starter ($7/month per service)
- No spin-down means instant responses
- Better performance overall
- Totally worth it for production

I ran on free tier for a month while testing, then upgraded when I started showing it to people.

## Setting Up a Custom Domain (Optional)

If you want to use your own domain instead of the Render URLs:

1. Go to your service settings
2. Click "Add Custom Domain"
3. Enter your domain (like `app.yourdomain.com`)
4. Follow the DNS instructions they give you
5. Wait for DNS to propagate (can take up to 24 hours, but usually ~1 hour)

I use Cloudflare for DNS and it was super straightforward.

## Quick Reference

After everything's deployed, here's what you'll have:

| What | Your URL |
|------|----------|
| Backend API | `https://your-backend.onrender.com` |
| Frontend App | `https://your-frontend.onrender.com` |
| Health Check | `https://your-backend.onrender.com/health` |
| Database | Only accessible from backend (internal) |

## Updating Your App

When you push changes to GitHub:
1. Render automatically detects the push (if auto-deploy is on)
2. Builds and deploys the new version
3. Takes about 2-5 minutes usually

**Database migrations:**
Don't worry - they run automatically on startup. The start command includes `prisma migrate deploy`.

**Manual deploy:**
If auto-deploy is off, just click "Manual Deploy" in Render dashboard.

## Backing Up Your Database

I do this once a week just to be safe:

```bash
# From your local terminal, set the EXTERNAL database URL
export DATABASE_URL="your-external-postgres-url"

# Dump the database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

Gives you a SQL file you can restore from if things go sideways.

## My Deploy Checklist

Here's what I run through every time I deploy:

1. ✅ Backend deploys successfully
2. ✅ Health check responds
3. ✅ Database has seed data
4. ✅ Frontend deploys successfully
5. ✅ Frontend can fetch routes
6. ✅ All four tabs work (Routes, Compare, Banking, Pooling)
7. ✅ No errors in browser console

## That's It!

You should now have a fully functional Fuel EU Maritime Compliance app running in the cloud. Pretty cool, right?

If you run into issues I didn't cover here, check:
- Render docs: https://render.com/docs
- Next.js docs: https://nextjs.org/docs  
- Prisma docs: https://www.prisma.io/docs

Or just open an issue on the GitHub repo and I'll try to help out.

Happy deploying! 🚀

---

*Last updated: After my third deployment when I finally got everything working smoothly*