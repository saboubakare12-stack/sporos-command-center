// ============================================
// SPOROS COMMAND CENTER — Configuration
// ============================================
// Edit this file to customize your dashboard.
// After saving changes, refresh your browser.

const config = {
  // --- Watchlist Tickers ---
  // Add or remove tickers you want to track
  watchlist: [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corp.' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'PMAR', name: 'Innovator U.S. Equity Power Buffer ETF - March' },
    { symbol: 'BUFF', name: 'Innovator Laddered Allocation Power Buffer ETF' },
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

  // --- Zacks Rank #1 (Strong Buy) Stocks ---
  // Update this list as rankings change
  zacksRankOne: [
    { symbol: 'CRWD', name: 'CrowdStrike Holdings', industry: 'Cybersecurity' },
    { symbol: 'AXON', name: 'Axon Enterprise', industry: 'Aerospace & Defense' },
    { symbol: 'VST', name: 'Vistra Corp.', industry: 'Utilities - Independent Power' },
    { symbol: 'TOST', name: 'Toast Inc.', industry: 'Software - Application' },
    { symbol: 'APP', name: 'AppLovin Corp.', industry: 'Software - Application' },
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
