const tabs = [
  { id: 'home', label: 'Home', icon: '⬡' },
  { id: 'tasks', label: 'Tasks', icon: '◆' },
  { id: 'content', label: 'Content', icon: '▶' },
  { id: 'touchpoints', label: 'Touchpoints', icon: '♡' },
];

export default function TabNav({ active, onChange }) {
  return (
    <nav className="bg-white border-b border-border sticky top-0 z-10">
      <div className="max-w-[1100px] mx-auto flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="bg-transparent border-none cursor-pointer transition-all font-body"
            style={{
              padding: '16px 28px',
              fontSize: 14,
              fontWeight: active === tab.id ? 600 : 400,
              color: active === tab.id ? '#2C2825' : '#A89F96',
              borderBottom: active === tab.id
                ? '2px solid #D4A843'
                : '2px solid transparent',
              letterSpacing: 0.3,
            }}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
