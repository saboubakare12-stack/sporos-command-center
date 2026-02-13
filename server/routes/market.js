import { Router } from 'express';
import fallbackConfig from '../config.cjs';
import { loadMarketConfig } from './sheets.js';

const router = Router();

const TWELVE_DATA_KEY = process.env.TWELVE_DATA_API_KEY;
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const useTwelveData = !!TWELVE_DATA_KEY;
const useAlphaVantage = !!ALPHA_VANTAGE_KEY;

// ---------- Symbol mapping ----------

/** Map Yahoo-style index symbols to Twelve Data format */
const TD_SYMBOL_MAP = { '^GSPC': 'SPX', '^DJI': 'DJI', '^IXIC': 'IXCOMP' };
function toTDSymbol(s) { return TD_SYMBOL_MAP[s] || s; }
function isIndexSymbol(s) { return s.startsWith('^'); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Twelve Data (indices only — 3 credits per refresh) ----------

async function fetchTwelveDataQuotes(symbols) {
  const tdSymbols = symbols.map(toTDSymbol);
  const url = `https://api.twelvedata.com/quote?symbol=${tdSymbols.join(',')}&apikey=${TWELVE_DATA_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const entries = symbols.length === 1 ? { [tdSymbols[0]]: data } : data;

  return symbols.map((originalSymbol) => {
    const q = entries[toTDSymbol(originalSymbol)];
    if (!q || q.code || !q.close) {
      return { symbol: originalSymbol, name: originalSymbol, price: 0, change: 0, changePercent: 0, previousClose: 0, marketState: 'UNKNOWN' };
    }
    const price = parseFloat(q.close) || 0;
    const prevClose = parseFloat(q.previous_close) || 0;
    return {
      symbol: originalSymbol,
      name: q.name || originalSymbol,
      price,
      change: parseFloat(q.change) || price - prevClose,
      changePercent: parseFloat(q.percent_change) || 0,
      previousClose: prevClose,
      marketState: q.is_market_open ? 'REGULAR' : 'CLOSED',
    };
  });
}

async function fetchTwelveDataTimeSeries(symbol) {
  const td = toTDSymbol(symbol);
  const url = `https://api.twelvedata.com/time_series?symbol=${td}&interval=1h&outputsize=40&apikey=${TWELVE_DATA_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.values || data.code) return [];
  return data.values.map((v) => parseFloat(v.close)).filter(Boolean).reverse();
}

// ---------- Alpha Vantage (stocks — 25 req/day, 5 req/min) ----------

async function fetchAlphaVantageQuote(symbol) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const q = data['Global Quote'];

  if (!q || !q['05. price']) {
    // Check for rate limit message
    if (data.Note || data.Information) {
      console.warn(`[AV] Rate limited for ${symbol}:`, data.Note || data.Information);
    }
    return null;
  }

  return {
    symbol: q['01. symbol'] || symbol,
    name: symbol, // AV doesn't return company name in GLOBAL_QUOTE
    price: parseFloat(q['05. price']) || 0,
    change: parseFloat(q['09. change']) || 0,
    changePercent: parseFloat(q['10. change percent']?.replace('%', '')) || 0,
    previousClose: parseFloat(q['08. previous close']) || 0,
    marketState: 'CLOSED', // AV doesn't provide market state; assume closed after hours
  };
}

/**
 * Fetch stock quotes from Alpha Vantage, respecting 5 req/min limit.
 * Returns as many as it can within the rate limit; returns cached/zero for the rest.
 */
async function fetchAlphaVantageQuotes(symbols) {
  const results = [];
  let requestCount = 0;

  for (const symbol of symbols) {
    // Respect 5 requests per minute — wait 13s between each to be safe
    if (requestCount > 0 && requestCount % 5 === 0) {
      console.log(`[AV] Pausing 65s after 5 requests (rate limit)...`);
      await sleep(65_000);
    }

    try {
      const quote = await fetchAlphaVantageQuote(symbol);
      if (quote) {
        results.push(quote);
      } else {
        results.push({ symbol, name: symbol, price: 0, change: 0, changePercent: 0, previousClose: 0, marketState: 'UNKNOWN' });
      }
    } catch (err) {
      console.warn(`[AV] Failed for ${symbol}:`, err.message);
      results.push({ symbol, name: symbol, price: 0, change: 0, changePercent: 0, previousClose: 0, marketState: 'UNKNOWN' });
    }

    requestCount++;

    // Small delay between requests to be polite
    if (requestCount < symbols.length) {
      await sleep(1000);
    }
  }

  return results;
}

// ---------- Yahoo Finance fallback (local dev) ----------

let yf = null;
async function getYF() {
  if (yf) return yf;
  try {
    const YahooFinance = (await import('yahoo-finance2')).default;
    yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
    return yf;
  } catch { return null; }
}

async function fetchYFQuotes(symbols) {
  const client = await getYF();
  if (!client) throw new Error('Yahoo Finance not available');
  return Promise.all(
    symbols.map(async (symbol) => {
      try {
        const q = await client.quote(symbol);
        return {
          symbol: q.symbol, name: q.shortName || q.longName || symbol,
          price: q.regularMarketPrice ?? 0, change: q.regularMarketChange ?? 0,
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

// ---------- Unified fetcher ----------

/**
 * Strategy:
 * - Cloud: Twelve Data for indices (3 symbols, 3 credits) + Alpha Vantage for stocks
 * - Local: Yahoo Finance for everything
 *
 * Alpha Vantage: 25 req/day, 5 req/min — so we cache aggressively (1 hour)
 * Twelve Data: 800 credits/day — indices only = ~3 credits per refresh
 */
async function getQuotes(symbols) {
  // Local dev: use Yahoo Finance for everything
  if (!useTwelveData && !useAlphaVantage) {
    return fetchYFQuotes(symbols);
  }

  const indexSymbols = symbols.filter(isIndexSymbol);
  const stockSymbols = symbols.filter((s) => !isIndexSymbol(s));
  const results = [];

  // Fetch indices from Twelve Data (cheap: 3 credits)
  if (useTwelveData && indexSymbols.length > 0) {
    try {
      const indexQuotes = await fetchTwelveDataQuotes(indexSymbols);
      results.push(...indexQuotes);
    } catch (err) {
      console.warn('[TD] Failed to fetch indices:', err.message);
      for (const s of indexSymbols) {
        results.push({ symbol: s, name: s, price: 0, change: 0, changePercent: 0, previousClose: 0, marketState: 'UNKNOWN' });
      }
    }
  }

  // Fetch stocks from Alpha Vantage
  if (useAlphaVantage && stockSymbols.length > 0) {
    const stockQuotes = await fetchAlphaVantageQuotes(stockSymbols);
    results.push(...stockQuotes);
  } else if (useTwelveData && stockSymbols.length > 0) {
    // Fallback: use Twelve Data for stocks too (expensive but works)
    try {
      const BATCH = 8;
      for (let i = 0; i < stockSymbols.length; i += BATCH) {
        const batch = stockSymbols.slice(i, i + BATCH);
        const batchQuotes = await fetchTwelveDataQuotes(batch);
        results.push(...batchQuotes);
        if (i + BATCH < stockSymbols.length) {
          console.log(`[TD] Waiting 65s before next batch...`);
          await sleep(65_000);
        }
      }
    } catch (err) {
      console.warn('[TD] Failed to fetch stocks:', err.message);
    }
  }

  return results;
}

async function getTimeSeries(symbol) {
  if (useTwelveData) return fetchTwelveDataTimeSeries(symbol);
  try { return await fetchYFTimeSeries(symbol); }
  catch (e) { console.warn(`Failed to fetch history for ${symbol}:`, e.message); return []; }
}

// ---------- Cache ----------

const cache = {
  quotes: { data: null, timestamp: 0 },
  history: { data: null, timestamp: 0 },
};

// Aggressive caching to conserve API credits:
// Quotes: 1 hour (AV only allows ~25 req/day anyway)
// Sparklines: 2 hours
const QUOTES_CACHE_TTL = (useTwelveData || useAlphaVantage) ? 60 * 60 * 1000 : 30 * 1000;
const SPARKLINE_CACHE_TTL = useTwelveData ? 2 * 60 * 60 * 1000 : 2 * 60 * 1000;

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
    for (const symbol of indexSymbols) {
      try {
        sparklines[symbol] = await getTimeSeries(symbol);
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
