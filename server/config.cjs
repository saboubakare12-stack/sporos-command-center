// Server-side copy of the config (CommonJS for the Express server)
const config = {
  watchlist: [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corp.' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'PMAR', name: 'Innovator U.S. Equity Power Buffer ETF - March' },
    { symbol: 'BUFF', name: 'Innovator Laddered Allocation Power Buffer ETF' },
  ],
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
  zacksRankOne: [
    { symbol: 'CRWD', name: 'CrowdStrike Holdings', industry: 'Cybersecurity' },
    { symbol: 'AXON', name: 'Axon Enterprise', industry: 'Aerospace & Defense' },
    { symbol: 'VST', name: 'Vistra Corp.', industry: 'Utilities - Independent Power' },
    { symbol: 'TOST', name: 'Toast Inc.', industry: 'Software - Application' },
    { symbol: 'APP', name: 'AppLovin Corp.', industry: 'Software - Application' },
  ],
  indices: [
    { symbol: '^GSPC', name: 'S&P 500' },
    { symbol: '^DJI', name: 'Dow Jones' },
    { symbol: '^IXIC', name: 'Nasdaq' },
  ],
};

module.exports = config;
