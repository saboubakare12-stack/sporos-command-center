import { Router } from 'express';
import YahooFinance from 'yahoo-finance2';
import fallbackConfig from '../config.cjs';
import { loadMarketConfig } from './sheets.js';

const router = Router();

// yahoo-finance2 v3 requires instantiation
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// In-memory cache with timestamps
const cache = {
  quotes: { data: null, timestamp: 0 },
  history: { data: null, timestamp: 0 },
};

const CACHE_TTL = 30 * 1000; // 30 seconds

/**
 * Get the market config — from Google Sheet if available, otherwise fallback.
 */
async function getConfig() {
  try {
    const sheetConfig = await loadMarketConfig();
    if (sheetConfig) return sheetConfig;
  } catch (err) {
    console.warn('Sheet config unavailable, using fallback:', err.message);
  }
  return fallbackConfig;
}

// GET /api/market/quotes — Fetch quotes for all tracked symbols
router.get('/quotes', async (_req, res) => {
  const now = Date.now();
  if (cache.quotes.data && now - cache.quotes.timestamp < CACHE_TTL) {
    return res.json(cache.quotes.data);
  }

  try {
    const config = await getConfig();

    const allSymbols = [
      ...config.indices.map((s) => s.symbol),
      ...config.watchlist.map((s) => s.symbol),
      ...config.sectors.map((s) => s.symbol),
      ...config.zacksRankOne.map((s) => s.symbol),
    ];
    // Deduplicate
    const symbols = [...new Set(allSymbols)];

    const quotes = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const q = await yf.quote(symbol);
          return {
            symbol: q.symbol,
            name: q.shortName || q.longName || symbol,
            price: q.regularMarketPrice ?? 0,
            change: q.regularMarketChange ?? 0,
            changePercent: q.regularMarketChangePercent ?? 0,
            previousClose: q.regularMarketPreviousClose ?? 0,
            marketState: q.marketState || 'CLOSED',
          };
        } catch (e) {
          console.warn(`Failed to fetch quote for ${symbol}:`, e.message);
          return {
            symbol,
            name: symbol,
            price: 0,
            change: 0,
            changePercent: 0,
            previousClose: 0,
            marketState: 'UNKNOWN',
          };
        }
      })
    );

    const result = {
      quotes: Object.fromEntries(quotes.map((q) => [q.symbol, q])),
      timestamp: new Date().toISOString(),
      marketOpen: quotes.some((q) => q.marketState === 'REGULAR'),
    };

    cache.quotes = { data: result, timestamp: now };
    res.json(result);
  } catch (err) {
    console.error('Error fetching market quotes:', err.message);
    if (cache.quotes.data) {
      return res.json(cache.quotes.data);
    }
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

// GET /api/market/history/:symbol — Fetch recent history for sparklines
router.get('/history/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const cacheKey = `history_${symbol}`;

  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL * 4) {
    return res.json(cache[cacheKey].data);
  }

  try {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 5);

    const result = await yf.chart(symbol, {
      period1: start,
      period2: end,
      interval: '1h',
    });

    const prices = (result.quotes || []).map((q) => q.close).filter(Boolean);

    cache[cacheKey] = { data: prices, timestamp: Date.now() };
    res.json(prices);
  } catch (err) {
    console.warn(`Failed to fetch history for ${symbol}:`, err.message);
    res.json([]);
  }
});

// GET /api/market/sparklines — Fetch sparkline data for indices
router.get('/sparklines', async (_req, res) => {
  const now = Date.now();
  if (cache.history.data && now - cache.history.timestamp < CACHE_TTL * 4) {
    return res.json(cache.history.data);
  }

  try {
    const config = await getConfig();
    const indexSymbols = config.indices.map((i) => i.symbol);
    const sparklines = {};

    await Promise.all(
      indexSymbols.map(async (symbol) => {
        try {
          const end = new Date();
          const start = new Date();
          start.setDate(start.getDate() - 5);

          const result = await yf.chart(symbol, {
            period1: start,
            period2: end,
            interval: '1h',
          });

          sparklines[symbol] = (result.quotes || []).map((q) => q.close).filter(Boolean);
        } catch (e) {
          console.warn(`Sparkline fetch failed for ${symbol}:`, e.message);
          sparklines[symbol] = [];
        }
      })
    );

    cache.history = { data: sparklines, timestamp: now };
    res.json(sparklines);
  } catch (err) {
    console.error('Error fetching sparklines:', err.message);
    res.json({});
  }
});

// GET /api/market/config — Expose the active market config to the frontend
router.get('/config', async (_req, res) => {
  try {
    const config = await getConfig();
    res.json(config);
  } catch (err) {
    console.error('Error fetching market config:', err.message);
    res.json(fallbackConfig);
  }
});

export { router as marketRouter };
