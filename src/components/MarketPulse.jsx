import { useState } from 'react';

const subViews = [
  { id: 'overview', label: 'Overview' },
  { id: 'watchlist', label: 'Mag 7' },
  { id: 'sectors', label: 'Sectors' },
];

function fmt(n) {
  if (n == null || n === 0) return '--';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PriceChange({ change, changePct, size = 'normal' }) {
  if (change == null || changePct == null) return <span className="text-text-muted">--</span>;
  const isUp = change >= 0;
  const color = isUp ? '#16A34A' : '#E85D4A';
  const arrow = isUp ? '▲' : '▼';
  const sign = isUp ? '+' : '';
  const fontSize = size === 'small' ? 11 : 12;
  return (
    <span style={{ color, fontSize, fontWeight: 600 }}>
      {arrow} {sign}{change.toFixed(2)} ({sign}{changePct.toFixed(2)}%)
    </span>
  );
}

function TickerRow({ symbol, name, quote, showIndustry, industry }) {
  const change = quote?.change ?? 0;
  const isUp = change >= 0;
  return (
    <div className="flex items-center justify-between border-b border-border-light last:border-0" style={{ padding: '12px 0' }}>
      <div className="flex items-center gap-3 flex-1">
        <div
          className="flex items-center justify-center rounded-md text-xs font-bold shrink-0"
          style={{
            width: 48,
            height: 32,
            background: isUp ? '#16A34A10' : '#E85D4A10',
            color: isUp ? '#16A34A' : '#E85D4A',
            fontFamily: "'DM Sans', monospace",
            letterSpacing: -0.3,
          }}
        >
          {symbol.replace('^', '')}
        </div>
        <div>
          <div className="text-sm font-medium text-charcoal">{name}</div>
          {showIndustry && industry && (
            <div className="text-[11px] text-text-muted">{industry}</div>
          )}
        </div>
      </div>
      <div className="text-right shrink-0 ml-4">
        <div className="text-[15px] font-semibold text-charcoal" style={{ fontVariantNumeric: 'tabular-nums' }}>
          ${quote ? fmt(quote.price) : '--'}
        </div>
        <PriceChange change={quote?.change} changePct={quote?.changePercent} size="small" />
      </div>
    </div>
  );
}

function MarketSection({ title, subtitle, children }) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-baseline mb-0.5">
        <h3 className="text-sm font-semibold text-charcoal m-0" style={{ letterSpacing: 0.2 }}>{title}</h3>
        {subtitle && <span className="text-[11px] text-text-muted">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function SectorCell({ symbol, name, quote }) {
  const pct = quote?.changePercent ?? 0;
  const change = quote?.change ?? 0;
  const isUp = change >= 0;
  return (
    <div
      className="rounded-lg"
      style={{
        padding: '10px 12px',
        background: isUp ? '#16A34A08' : '#E85D4A08',
        border: `1px solid ${isUp ? '#16A34A20' : '#E85D4A20'}`,
      }}
    >
      <div className="flex justify-between items-center">
        <div>
          <div className="text-[11px] font-semibold text-text-secondary">{symbol}</div>
          <div className="text-[10px] text-text-muted">{name}</div>
        </div>
        <div
          className="text-xs font-bold"
          style={{ color: isUp ? '#16A34A' : '#E85D4A' }}
        >
          {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

// --- Sub-view: Overview ---
function OverviewView({ quotes, onSwitchTab, config }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Left: Mag 7 preview */}
      <div className="bg-white rounded-[14px] border border-border" style={{ padding: '20px 22px' }}>
        <MarketSection title="Magnificent 7" subtitle={`${config.watchlist.length} stocks`}>
          {config.watchlist.map((t) => (
            <TickerRow key={t.symbol} symbol={t.symbol} name={t.name} quote={quotes[t.symbol]} />
          ))}
        </MarketSection>
      </div>

      {/* Right: Sector heatmap */}
      <div className="bg-white rounded-[14px] border border-border" style={{ padding: '20px 22px' }}>
        <MarketSection title="Sector Heat Map" subtitle="Today's movers">
          <div className="grid grid-cols-2 gap-2 mt-2">
            {config.sectors.map((s) => (
              <SectorCell key={s.symbol} symbol={s.symbol} name={s.name} quote={quotes[s.symbol]} />
            ))}
          </div>
        </MarketSection>
      </div>
    </div>
  );
}

// --- Sub-view: Full Watchlist ---
function WatchlistView({ quotes, config }) {
  return (
    <div className="bg-white rounded-[14px] border border-border" style={{ padding: '20px 22px' }}>
      <MarketSection title="Magnificent 7" subtitle="Top mega-cap tech stocks">
        {config.watchlist.map((t) => (
          <TickerRow key={t.symbol} symbol={t.symbol} name={t.name} quote={quotes[t.symbol]} />
        ))}
      </MarketSection>
    </div>
  );
}

// --- Sub-view: Sectors ---
function SectorsView({ quotes, config }) {
  const left = config.sectors.filter((_, i) => i % 2 === 0);
  const right = config.sectors.filter((_, i) => i % 2 === 1);

  return (
    <div className="bg-white rounded-[14px] border border-border" style={{ padding: '20px 22px' }}>
      <MarketSection title="Sector ETFs" subtitle="Performance today">
        <div className="grid grid-cols-2 gap-0">
          <div>
            {left.map((s) => (
              <TickerRow key={s.symbol} symbol={s.symbol} name={s.name} quote={quotes[s.symbol]} />
            ))}
          </div>
          <div className="border-l border-border-light pl-5">
            {right.map((s) => (
              <TickerRow key={s.symbol} symbol={s.symbol} name={s.name} quote={quotes[s.symbol]} />
            ))}
          </div>
        </div>
      </MarketSection>
    </div>
  );
}

const defaultConfig = { indices: [], watchlist: [], sectors: [] };

export default function MarketPulse({ quotes, marketOpen, lastUpdated, onRefresh, config = defaultConfig }) {
  const [view, setView] = useState('overview');

  return (
    <div>
      {/* Title header row */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="font-heading text-[22px] font-medium m-0">Market Pulse</h2>
          <div className="text-xs text-text-muted mt-1">
            Last updated:{' '}
            {lastUpdated
              ? new Date(lastUpdated).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
              : '--'}
            <span
              className="inline-block rounded-full ml-2 align-middle"
              style={{
                width: 7,
                height: 7,
                background: marketOpen ? '#16A34A' : '#E85D4A',
              }}
            />
            <span className="ml-1 text-[11px]">{marketOpen ? 'Market Open' : 'Market Closed'}</span>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="border-none rounded-full cursor-pointer font-body"
          style={{
            background: '#2C2825',
            color: '#F7F4F0',
            padding: '8px 20px',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.3,
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Sub-view pills */}
      <div className="flex gap-2 mb-5">
        {subViews.map((sv) => (
          <button
            key={sv.id}
            onClick={() => setView(sv.id)}
            className="cursor-pointer font-body transition-all"
            style={{
              background: view === sv.id ? '#2C2825' : '#F7F4F0',
              color: view === sv.id ? '#F7F4F0' : '#6B6560',
              border: '1px solid #E8E4DF',
              borderRadius: 20,
              padding: '6px 18px',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {sv.label}
          </button>
        ))}
      </div>

      {view === 'overview' && <OverviewView quotes={quotes} onSwitchTab={setView} config={config} />}
      {view === 'watchlist' && <WatchlistView quotes={quotes} config={config} />}
      {view === 'sectors' && <SectorsView quotes={quotes} config={config} />}

      {/* Connected-to footer */}
      <div className="mt-4 py-3.5 px-5 bg-surface rounded-[10px] text-[13px] text-text-secondary text-center">
        Indices via Twelve Data · Stocks via Alpha Vantage · Cached hourly
      </div>
    </div>
  );
}
