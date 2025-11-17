// Login endpoint
import express from 'express';
import { authenticate } from '../lib/loginModule.js';
import { requireAuth } from '../lib/security.js';

const router = express.Router();

router.post('/login', requireAuth, async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  try {
    // Execute login flow
    const { browser, page } = await authenticate({
      username,
      password,
      headless: true
    });

    // Capture authenticated state
    const screenshot = await page.screenshot({ encoding: 'base64' });
    await browser.close();

    res.json({
      success: true,
      screenshot: `data:image/png;base64,${screenshot}`,
      sessionValid: true
    });
  } catch (error) {
    console.error('[AUTH_ERROR]', error.message);
    res.status(401).json({
      error: 'Authentication failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;