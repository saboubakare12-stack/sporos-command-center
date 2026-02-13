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

export default function Header({ touchpointsThisWeek = 0 }) {
  return (
    <header className="bg-charcoal" style={{ borderBottom: '3px solid #D4A843' }}>
      <div className="max-w-[1100px] mx-auto" style={{ padding: '28px 36px 20px' }}>
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
      </div>
    </header>
  );
}
