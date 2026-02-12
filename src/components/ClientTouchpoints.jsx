import { useTouchpoints } from '../hooks/useTouchpoints';

function daysUntil(dateStr) {
  if (!dateStr) return Infinity;
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

const typeColor = (t) => {
  const map = {
    Birthday: '#E85D4A',
    Anniversary: '#9B6FCF',
    'Annual Review': '#4A90D9',
  };
  return map[t] || '#8A8A8A';
};

const typeIcons = {
  Birthday: '🎂',
  Anniversary: '💍',
  'Annual Review': '📋',
};

function Badge({ color, children }) {
  return (
    <span
      className="text-[11px] font-semibold rounded-full whitespace-nowrap uppercase"
      style={{
        background: color + '18',
        color,
        padding: '3px 10px',
        letterSpacing: 0.3,
      }}
    >
      {children}
    </span>
  );
}

function UrgencyBar({ daysAway }) {
  const pct = Math.max(0, Math.min(100, ((30 - daysAway) / 30) * 100));
  const color = daysAway <= 3 ? '#E85D4A' : daysAway <= 7 ? '#D4A843' : '#6B8F71';
  return (
    <div style={{ width: 60, height: 4, background: '#EDE9E4', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
    </div>
  );
}

export default function ClientTouchpoints() {
  const { touchpoints, loading } = useTouchpoints();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-charcoal/40">Loading touchpoints...</p>
      </div>
    );
  }

  const sorted = [...touchpoints].sort((a, b) => daysUntil(a.date) - daysUntil(b.date));

  return (
    <div>
      <h2 className="font-heading text-[22px] font-medium m-0 mb-5">Client Touchpoints</h2>

      <div className="flex flex-col gap-2.5">
        {sorted.map((tp) => {
          const days = daysUntil(tp.date);
          const color = typeColor(tp.type);
          return (
            <div
              key={tp.id}
              className="bg-white rounded-[14px] border border-border"
              style={{ padding: '20px 22px' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5 flex-1">
                  {/* Circular icon */}
                  <div
                    className="shrink-0 rounded-full flex items-center justify-center text-lg"
                    style={{
                      width: 44,
                      height: 44,
                      background: color + '15',
                    }}
                  >
                    {typeIcons[tp.type] || '📅'}
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold">{tp.clientName}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge color={color}>{tp.type}</Badge>
                      {tp.lastContact && (
                        <span className="text-xs text-text-muted">
                          Last contact:{' '}
                          {new Date(tp.lastContact).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div
                    className="text-sm font-semibold"
                    style={{ color: days <= 3 ? '#E85D4A' : '#2C2825' }}
                  >
                    {tp.date
                      ? new Date(tp.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : ''}
                  </div>
                  <div className="flex items-center gap-2 mt-1 justify-end">
                    <span
                      className="text-xs"
                      style={{ color: days <= 3 ? '#E85D4A' : '#6B6560' }}
                    >
                      {days < 0 ? 'Past due' : `${days}d away`}
                    </span>
                    <UrgencyBar daysAway={days < 0 ? 0 : days} />
                  </div>
                </div>
              </div>

              {/* Action bar */}
              {tp.suggestedAction && (
                <div className="mt-3 py-2 px-3.5 bg-warm-white rounded-lg text-[13px] text-text-tertiary">
                  <strong>Action:</strong> {tp.suggestedAction}
                </div>
              )}
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div className="text-center py-12 text-charcoal/30">
            No upcoming touchpoints found.
          </div>
        )}
      </div>

      {/* Connected-to footer */}
      <div className="mt-4 py-3.5 px-5 bg-surface rounded-[10px] text-[13px] text-text-secondary text-center">
        🎂 Connected to: <strong>Google Sheets</strong> — Birthdays & anniversaries sync automatically
      </div>
    </div>
  );
}
