import { useState } from 'react';
import { useContent } from '../hooks/useContent';

const statusColor = (s) => {
  const map = {
    Idea: '#8A8A8A',
    'Script Ready': '#D4A843',
    'In Design': '#9B6FCF',
    Filmed: '#4A90D9',
    Published: '#6B8F71',
  };
  return map[s] || '#8A8A8A';
};

const typeColor = (t) => (t === 'Reel' ? '#E85D4A' : '#9B6FCF');

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

export default function ContentCalendar() {
  const { content, loading } = useContent();
  const [expandedId, setExpandedId] = useState(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-charcoal/40">Loading content calendar...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-heading text-[22px] font-medium m-0 mb-5">Content Calendar</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {content.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <div
              key={item.id}
              className="bg-white rounded-[14px] border border-border cursor-pointer transition-all hover:shadow-sm"
              style={{ padding: '20px 22px' }}
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
            >
              {/* Header: title + type badge */}
              <div className="flex justify-between items-start mb-2.5">
                <div className="text-[15px] font-semibold flex-1 leading-snug">{item.title}</div>
                <Badge color={typeColor(item.type)}>{item.type}</Badge>
              </div>

              {/* Status badge */}
              <div className="flex gap-2 mb-2.5">
                <Badge color={statusColor(item.status)}>{item.status}</Badge>
              </div>

              {/* Dates */}
              <div className="flex gap-5 text-xs text-text-secondary">
                {item.filmDate && (
                  <span>
                    🎬 Film:{' '}
                    {new Date(item.filmDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
                {item.publishDate && (
                  <span>
                    📅 Publish:{' '}
                    {new Date(item.publishDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
              </div>

              {/* Expandable script */}
              {isExpanded && item.script && (
                <div
                  className="mt-3.5 bg-warm-white rounded-[10px] text-[13px] text-text-tertiary leading-relaxed"
                  style={{
                    padding: '14px 16px',
                    borderLeft: '3px solid #D4A843',
                  }}
                >
                  <div className="text-[11px] font-semibold text-text-muted tracking-[0.5px] mb-1.5 uppercase">
                    SCRIPT / OUTLINE
                  </div>
                  {item.script}
                </div>
              )}
            </div>
          );
        })}

        {content.length === 0 && (
          <div className="col-span-2 text-center py-12 text-charcoal/30">
            No content items found.
          </div>
        )}
      </div>

      {/* Connected-to footer */}
      <div className="mt-4 py-3.5 px-5 bg-surface rounded-[10px] text-[13px] text-text-secondary text-center">
        📝 Connected to: <strong>Notion</strong> — Content ideas & scripts sync automatically
      </div>
    </div>
  );
}
