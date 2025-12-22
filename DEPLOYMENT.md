# Deployment Guide: From Fallback Data to API

This guide explains how to deploy your site to use the API instead of fallback data.

## 🚀 Quick Start (Local Testing)

1. **Start the API server:**
   ```bash
   npm run server
   ```

2. **In another terminal, start the dev server:**
   ```bash
   npm run dev
   ```

3. **Test API endpoints:**
   - http://localhost:3001/api/files?directory=src/content/calendar
   - http://localhost:3001/api/file?path=src/content/calendar/diversions-game-night.md

## 🏗️ Deployment Options

### Option A: Single Server (Recommended for simplicity)

**Platforms:** Railway, Render, Heroku, DigitalOcean App Platform

**Steps:**
1. Build the React app: `npm run build`
2. Deploy the entire project (includes Express server)
3. Set environment variables:
   - `NODE_ENV=production`
   - `REACT_APP_API_BASE_URL=https://your-domain.com`
   - `REACT_APP_USE_FALLBACK=false`

**Example for Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Option B: Separate Frontend/Backend

**Frontend (Vercel/Netlify):**
1. Build: `npm run build`
2. Deploy `build/` folder
3. Set environment variables:
   - `REACT_APP_API_BASE_URL=https://your-api-domain.com`
   - `REACT_APP_USE_FALLBACK=false`

**Backend (Railway/Render):**
1. Deploy only the server files
2. Ensure `src/content/` directory is included
3. Set `NODE_ENV=production`

### Option C: Serverless (Advanced)

Convert API endpoints to serverless functions:

**Vercel Functions:**
```javascript
// api/files.js (Vercel function)
export default async function handler(req, res) {
  // Your existing API logic
}
```

## 🔧 Environment Variables

### Development (.env.development)
```
REACT_APP_API_BASE_URL=http://localhost:3001
REACT_APP_USE_FALLBACK=false
```

### Production (.env.production)
```
REACT_APP_API_BASE_URL=https://your-domain.com
REACT_APP_USE_FALLBACK=false
```

### Emergency Fallback
```
REACT_APP_USE_FALLBACK=true  # Forces fallback data usage
```

## 📁 Required Files for Deployment

Ensure these are included in your deployment:

```
├── build/                 # React build output
├── src/content/          # Markdown files
│   ├── calendar/
│   ├── news/
│   └── gamemasters/
├── server.js             # Express server
├── package.json
└── node_modules/         # Dependencies
```

## 🔍 Testing Your Deployment

1. **Check API endpoints:**
   - `GET /api/files?directory=src/content/calendar`
   - `GET /api/file?path=src/content/calendar/diversions-game-night.md`

2. **Verify content loads:**
   - Calendar events display
   - News articles load
   - Game Masters list appears

3. **Check browser console:**
   - No API errors
   - Fallback warnings only on actual failures

## 🚨 Troubleshooting

### API Not Working
- Check `REACT_APP_API_BASE_URL` is correct
- Verify server is running and accessible
- Check CORS configuration

### Content Not Loading
- Verify `src/content/` directory exists in deployment
- Check file permissions
- Review server logs for errors

### Emergency Fallback
Set `REACT_APP_USE_FALLBACK=true` to immediately switch back to hardcoded data.

## 📊 Monitoring

Add logging to track API usage:
- API response times
- Fallback usage frequency
- Error rates

This helps identify when the API is having issues and fallback data is being used.