import { Router } from 'express';
import fallbackConfig from '../config.cjs';
import { loadMarketConfig } from './sheets.js';

const router = Router();

const TWELVE_DATA_KEY = process.env.TWELVE_DATA_API_KEY;
const useTwelveData = !!TWELVE_DATA_KEY;

// ---------- Twelve Data helpers (cloud-friendly) ----------
// Free tier: 8 credits/minute, 800 credits/day
// Each symbol in a request costs 1 credit

/** Map Yahoo-style index symbols to Twelve Data format */
const TD_SYMBOL_MAP = {
  '^GSPC': 'SPX',
  '^DJI': 'DJI',
  '^IXIC': 'IXCOMP',
};

function toTDSymbol(symbol) {
  return TD_SYMBOL_MAP[symbol] || symbol;
}

/** Sleep helper */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch quotes from Twelve Data in batches of 8 symbols,
 * waiting 65s between batches to stay within 8 credits/minute.
 */
async function fetchTwelveDataQuotes(symbols) {
  const BATCH_SIZE = 8; // max 8 credits per minute
  const allResults = [];

  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    const batch = symbols.slice(i, i + BATCH_SIZE);
    const tdSymbols = batch.map(toTDSymbol);
    const url = `https://api.twelvedata.com/quote?symbol=${tdSymbols.join(',')}&apikey=${TWELVE_DATA_KEY}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      // Single symbol returns object directly; multiple returns keyed object
      const entries = batch.length === 1 ? { [tdSymbols[0]]: data } : data;

      for (const originalSymbol of batch) {
        const td = toTDSymbol(originalSymbol);
        const q = entries[td];

        if (!q || q.code || !q.close) {
          allResults.push({
            symbol: originalSymbol,
            name: originalSymbol,
            price: 0, change: 0, changePercent: 0, previousClose: 0,
            marketState: 'UNKNOWN',
          });
          continue;
        }

        const price = parseFloat(q.close) || 0;
        const prevClose = parseFloat(q.previous_close) || 0;
        const change = parseFloat(q.change) || price - prevClose;
        const changePercent = parseFloat(q.percent_change) || 0;

        allResults.push({
          symbol: originalSymbol,
          name: q.name || originalSymbol,
          price,
          change,
          changePercent,
          previousClose: prevClose,
          marketState: q.is_market_open ? 'REGULAR' : 'CLOSED',
        });
      }
    } catch (err) {
      console.warn(`Twelve Data batch fetch failed:`, err.message);
      for (const s of batch) {
        allResults.push({
          symbol: s, name: s, price: 0, change: 0, changePercent: 0,
          previousClose: 0, marketState: 'UNKNOWN',
        });
      }
    }

    // Wait before next batch to respect rate limit (8 credits/min)
    if (i + BATCH_SIZE < symbols.length) {
      console.log(`[Market] Waiting 65s before next batch (rate limit)...`);
      await sleep(65_000);
    }
  }

  return allResults;
}

/**
 * Fetch sparkline time series for a single symbol from Twelve Data.
 */
async function fetchTwelveDataTimeSeries(symbol) {
  const td = toTDSymbol(symbol);
  const url = `https://api.twelvedata.com/time_series?symbol=${td}&interval=1h&outputsize=40&apikey=${TWELVE_DATA_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.values || data.code) return [];
  return data.values.map((v) => parseFloat(v.close)).filter(Boolean).reverse();
}

// ---------- Yahoo Finance fallback (local dev) ----------

let yf = null;
async function getYF() {
  if (yf) return yf;
  try {
    const YahooFinance = (await import('yahoo-finance2')).default;
    yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
    return yf;
  } catch {
    return null;
  }
}

async function fetchYFQuotes(symbols) {
  const client = await getYF();
  if (!client) throw new Error('Yahoo Finance not available');
  return Promise.all(
    symbols.map(async (symbol) => {
      try {
        const q = await client.quote(symbol);
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
        return { symbol, name: symbol, price: 0, change: 0, changePercent: 0, previousClose: 0, marketState: 'UNKNOWN' };
      }
    })
  );
}

async function fetchYFTimeSeries(symbol) {
  const client = await getYF();
  if (!client) return [];
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 5);
  const result = await client.chart(symbol, { period1: start, period2: end, interval: '1h' });
  return (result.quotes || []).map((q) => q.close).filter(Boolean);
}

// ---------- Unified fetchers ----------

async function getQuotes(symbols) {
  if (useTwelveData) return fetchTwelveDataQuotes(symbols);
  return fetchYFQuotes(symbols);
}

async function getTimeSeries(symbol) {
  if (useTwelveData) return fetchTwelveDataTimeSeries(symbol);
  try {
    return await fetchYFTimeSeries(symbol);
  } catch (e) {
    console.warn(`Failed to fetch history for ${symbol}:`, e.message);
    return [];
  }
}

// ---------- Cache ----------

const cache = {
  quotes: { data: null, timestamp: 0 },
  history: { data: null, timestamp: 0 },
};

// Twelve Data: 15 min cache to conserve credits (800/day ÷ ~43 symbols = ~18 refreshes/day)
// Yahoo: 30s cache for local dev
const QUOTES_CACHE_TTL = useTwelveData ? 15 * 60 * 1000 : 30 * 1000;
// Sparklines change slowly — cache for 1 hour (Twelve Data) or 2 min (Yahoo)
const SPARKLINE_CACHE_TTL = useTwelveData ? 60 * 60 * 1000 : 2 * 60 * 1000;

async function getConfig() {
  try {
    const sheetConfig = await loadMarketConfig();
    if (sheetConfig) return sheetConfig;
  } catch (err) {
    console.warn('Sheet config unavailable, using fallback:', err.message);
  }
  return fallbackConfig;
}

// ---------- Routes ----------

router.get('/quotes', async (_req, res) => {
  const now = Date.now();
  if (cache.quotes.data && now - cache.quotes.timestamp < QUOTES_CACHE_TTL) {
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
    const symbols = [...new Set(allSymbols)];

    const quotes = await getQuotes(symbols);

    const result = {
      quotes: Object.fromEntries(quotes.map((q) => [q.symbol, q])),
      timestamp: new Date().toISOString(),
      marketOpen: quotes.some((q) => q.marketState === 'REGULAR'),
    };

    cache.quotes = { data: result, timestamp: now };
    res.json(result);
  } catch (err) {
    console.error('Error fetching market quotes:', err.message);
    if (cache.quotes.data) return res.json(cache.quotes.data);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

router.get('/history/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const cacheKey = `history_${symbol}`;

  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < SPARKLINE_CACHE_TTL) {
    return res.json(cache[cacheKey].data);
  }

  try {
    const prices = await getTimeSeries(symbol);
    cache[cacheKey] = { data: prices, timestamp: Date.now() };
    res.json(prices);
  } catch (err) {
    console.warn(`Failed to fetch history for ${symbol}:`, err.message);
    res.json([]);
  }
});

router.get('/sparklines', async (_req, res) => {
  const now = Date.now();
  if (cache.history.data && now - cache.history.timestamp < SPARKLINE_CACHE_TTL) {
    return res.json(cache.history.data);
  }

  try {
    const config = await getConfig();
    const indexSymbols = config.indices.map((i) => i.symbol);
    const sparklines = {};

    // Fetch sparklines sequentially with delay to respect rate limits
    for (const symbol of indexSymbols) {
      try {
        sparklines[symbol] = await getTimeSeries(symbol);
        // Wait between each to stay under 8 credits/min on Twelve Data
        if (useTwelveData && indexSymbols.indexOf(symbol) < indexSymbols.length - 1) {
          await sleep(8000);
        }
      } catch (e) {
        console.warn(`Sparkline fetch failed for ${symbol}:`, e.message);
        sparklines[symbol] = [];
      }
    }

    cache.history = { data: sparklines, timestamp: now };
    res.json(sparklines);
  } catch (err) {
    console.error('Error fetching sparklines:', err.message);
    res.json({});
  }
});

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
