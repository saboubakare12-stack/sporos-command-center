import Sparkline from './Sparkline';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatPrice(n) {
  if (n == null || n === 0) return '--';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PriceChange({ change, changePercent }) {
  if (change == null || changePercent == null) return <span className="text-xs text-text-muted">--</span>;
  const isUp = change >= 0;
  const color = isUp ? 'text-[#16A34A]' : 'text-[#E85D4A]';
  const arrow = isUp ? '▲' : '▼';
  const sign = isUp ? '+' : '';
  return (
    <span className={`text-[11px] font-semibold ${color}`}>
      {arrow} {sign}{change.toFixed(2)} ({sign}{changePercent.toFixed(2)}%)
    </span>
  );
}

export default function Header({
  quotes,
  sparklines,
  touchpointsThisWeek = 0,
  config = { indices: [] },
}) {
  return (
    <header className="bg-charcoal" style={{ borderBottom: '3px solid #D4A843' }}>
      <div className="max-w-[1100px] mx-auto" style={{ padding: '28px 36px 20px' }}>
        {/* Top section */}
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[11px] tracking-[3px] text-gold font-semibold uppercase mb-1.5">
              Sporos Wealth Management
            </div>
            <h1 className="font-heading text-[28px] text-warm-white font-medium m-0">
              {getGreeting()}, Samee
            </h1>
          </div>
          <div className="text-right">
            <div className="text-[13px] text-text-muted">{formatDate()}</div>
            {touchpointsThisWeek > 0 && (
              <div className="mt-1.5 text-xs text-gold">
                ♡ {touchpointsThisWeek} touchpoint{touchpointsThisWeek > 1 ? 's' : ''} this week
              </div>
            )}
          </div>
        </div>

        {/* Index Ticker Strip */}
        <div className="flex gap-8 mt-5 pt-4 border-t border-charcoal-light">
          {config.indices.map((idx) => {
            const q = quotes[idx.symbol];
            const spark = sparklines[idx.symbol] || [];
            return (
              <div key={idx.symbol} className="flex items-center gap-3">
                <div>
                  <div className="text-[11px] text-text-muted tracking-[0.5px] uppercase">
                    {idx.name}
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-[20px] font-semibold text-warm-white font-body" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {q ? formatPrice(q.price) : '--'}
                    </span>
                    <PriceChange change={q?.change} changePercent={q?.changePercent} />
                  </div>
                </div>
                <Sparkline data={spark} width={80} height={24} />
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
}
