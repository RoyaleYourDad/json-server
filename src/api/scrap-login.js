import axios from 'axios';
import { JSDOM } from 'jsdom';

const URL = "https://student.tcti.uz/dashboard/login";
const CACHE_TTL = 60 * 1000; // 60 seconds

// In-memory cache with initialization
let cache = {
  json: null,
  lastUpdate: 0,
  isFetching: false
};

// Core DOM conversion logic (unchanged from your code)
function domToJson(node) {
  if (node.nodeType === 1) {
    const tagName = node.tagName.toLowerCase();
    if (tagName === 'script') return null;
    if (tagName === 'link') {
      const rel = node.getAttribute('rel');
      if (rel && rel.toLowerCase() === 'stylesheet') return null;
    }

    const obj = { type: tagName };
    
    if (node.attributes && node.attributes.length > 0) {
      obj.attributes = {};
      for (let attr of node.attributes) {
        obj.attributes[attr.name] = attr.value;
      }
    }

    const children = [];
    node.childNodes.forEach(child => {
      if (child.nodeType === 1) {
        const result = domToJson(child);
        if (result) children.push(result);
      } 
      else if (child.nodeType === 3) {
        const text = child.textContent.trim();
        if (text) children.push(text);
      }
    });

    if (children.length > 0) obj.children = children;
    return obj;
  }
  return null;
}

// Background scraper function
async function scrapeAndCache() {
  if (cache.isFetching) return;
  
  cache.isFetching = true;
  try {
    console.log(`[SCRAPER] Fetching fresh data from ${URL}`);
    const { data: html } = await axios.get(URL, { timeout: 10000 });
    const dom = new JSDOM(html);
    cache.json = domToJson(dom.window.document.documentElement);
    cache.lastUpdate = Date.now();
    console.log(`[SCRAPER] ✅ Updated at ${new Date().toISOString()}`);
  } catch (err) {
    console.error('[SCRAPER] ✖ Failed:', err.message);
  } finally {
    cache.isFetching = false;
  }
}

// Start background process
console.log('[SCRAPER] Initializing background scraper');
scrapeAndCache(); // Initial fetch
setInterval(scrapeAndCache, CACHE_TTL);

// Express route handler
export const getLoginJson = (req, res) => {
  if (!cache.json) {
    console.warn('[SCRAPER] Serving stale data - initial fetch pending');
    res.status(503).json({ error: 'Initial data fetch in progress' });
    return;
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="login.json"');
  res.setHeader('Cache-Control', `public, max-age=${CACHE_TTL/1000}`);
  res.send(JSON.stringify(cache.json, null, 2));
};