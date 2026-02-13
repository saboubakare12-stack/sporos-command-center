// Server-side copy of the config (CommonJS for the Express server)
const config = {
  watchlist: [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corp.' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
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
  indices: [
    { symbol: '^GSPC', name: 'S&P 500' },
    { symbol: '^DJI', name: 'Dow Jones' },
    { symbol: '^IXIC', name: 'Nasdaq' },
  ],
};

module.exports = config;
