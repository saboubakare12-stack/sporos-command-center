// ============================================
// SPOROS COMMAND CENTER — Configuration
// ============================================
// Edit this file to customize your dashboard.
// After saving changes, refresh your browser.

const config = {
  // --- Magnificent 7 Stocks ---
  watchlist: [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corp.' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
  ],

  // --- Sector ETFs ---
  sectors: [
    { symbol: 'XLK', name: 'Technology' },
    { symbol: 'XLF', name: 'Financials' },
    { symbol: 'XLE', name: 'Energy' },
    { symbol: 'XLV', name: 'Health Care' },
    { symbol: 'XLI', name: 'Industrials' },
    { symbol: 'XLY', name: 'Consumer Discretionary' },
    { symbol: 'XLP', name: 'Consumer Staples' },
    { symbol: 'XLRE', name: 'Real Estate' },
  ],

  // --- Major Indices (shown in header ticker strip) ---
  indices: [
    { symbol: '^GSPC', name: 'S&P 500' },
    { symbol: '^DJI', name: 'Dow Jones' },
    { symbol: '^IXIC', name: 'Nasdaq' },
  ],

  // --- Refresh Interval ---
  // How often to refresh market data (in seconds)
  refreshInterval: 60,

  // --- Market Hours (Eastern Time) ---
  marketOpen: { hour: 9, minute: 30 },
  marketClose: { hour: 16, minute: 0 },
};

export default config;
