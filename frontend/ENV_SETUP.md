# Environment Variable Setup

## Overview

The frontend uses `NEXT_PUBLIC_API_BASE_URL` to connect to the backend API. This variable must be set correctly for both local development and production deployment.

## Fixed Issues

✅ **API client now properly imports from validated env**
- Changed from `process.env.NEXT_PUBLIC_API_BASE_URL` (direct access)
- To `env.NEXT_PUBLIC_API_BASE_URL` (validated through `src/env.js`)

✅ **Default fallback added**
- If env variable is not set, defaults to `http://localhost:3000`

## Local Development Setup

Create a `.env.local` file in the frontend directory:

```bash
cd frontend
```

```env
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

## Production/Render Setup

### Option 1: Using Render Dashboard

1. Go to your Render frontend service
2. Navigate to "Environment" tab
3. Add environment variable:
   - **Key**: `NEXT_PUBLIC_API_BASE_URL`
   - **Value**: Your backend URL (e.g., `https://your-backend-name.onrender.com`)
4. Click "Save Changes"
5. Redeploy your service

### Option 2: Using `.env` file (committed to repo)

Create a `.env` file in the frontend directory:

```env
# .env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-name.onrender.com
```

**⚠️ Note**: `.env.local` is for local development only and should NOT be committed to git.

## Environment Variable Priority

Next.js loads environment variables in this order (highest priority first):

1. `.env.local` (local development, gitignored)
2. `.env.production` (production builds)
3. `.env` (all environments)

## Verification

To verify your environment variable is loaded correctly:

```bash
# During build
npm run build

# You should see no errors about NEXT_PUBLIC_API_BASE_URL
```

## Troubleshooting

### Issue: API calls returning 404 or connection errors

**Solution**: Check that `NEXT_PUBLIC_API_BASE_URL` is:
- Set correctly in Render dashboard or `.env.local`
- Points to the correct backend URL
- Does NOT have a trailing slash (e.g., `http://localhost:3000` not `http://localhost:3000/`)

### Issue: Environment variable not updating

**Solution**:
1. Clear Next.js cache: `rm -rf .next`
2. Restart dev server: `npm run dev`
3. For Render: Trigger a new deployment after updating env vars

### Issue: CORS errors

**Solution**: Backend must have CORS enabled and allow your frontend domain. Check `Backend/src/infrastructure/server/expressApp.ts`.

## Current Configuration

| Environment | API URL |
|------------|---------|
| Local Development | `http://localhost:3000` (default) |
| Production (Render) | Set in Render dashboard or `.env` |

## Backend URL Structure

Your backend should expose these endpoints:
- `GET /routes`
- `GET /routes/comparison`
- `POST /routes/:id/baseline`
- `GET /compliance/cb`
- `GET /compliance/adjusted-cb`
- `GET /banking/records`
- `POST /banking/bank`
- `POST /banking/apply`
- `POST /pools`
- `GET /health` (health check)

