import express from 'express';
import dotenv from 'dotenv';
import { getLocalIP } from './lib/networkUtils.js';
import { securityMiddleware } from './lib/security.js';
import { getLoginJson } from './api/scrap-login.js';
import authRouter from './api/authRouter.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const LOCAL_IP = getLocalIP();

// Mount PUBLIC scraper endpoint BEFORE security middleware
+ app.get('/login.json', getLoginJson);

// Security middleware for ALL other routes
app.use(securityMiddleware);
app.use(express.json({ limit: '10kb' }));

// API routes
app.use('/api', authRouter);

// Health check
app.get('/health', (req, res) => {
  const now = Date.now();
  res.json({ 
    status: 'ok',
    scraper: {
      lastUpdate: new Date(cache.lastUpdate).toISOString(),
      nextUpdate: new Date(cache.lastUpdate + CACHE_TTL).toISOString(),
      stale: (now - cache.lastUpdate) > CACHE_TTL
    }
  });
});

app.listen(PORT, () => {
  console.log(`\n✅ Server Running`);
  console.log(`🌐 Local Access: http://localhost:${PORT}/login.json`);
  console.log(`📡 Network Access: http://${LOCAL_IP}:${PORT}/login.json`);
  console.log(`⏱️  Background scraper updating every 60 seconds\n`);
});