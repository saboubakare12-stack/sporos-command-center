import { useState } from 'react';
import ContentFormModal from './ContentFormModal';
import ConfirmDialog from './ConfirmDialog';

const statusColor = (s) => {
  const map = {
    'Not started': '#8A8A8A',
    'Needs Image': '#E85D4A',
    Drafted: '#4A90D9',
    Scheduled: '#D4A843',
    Posted: '#6B8F71',
  };
  return map[s] || '#8A8A8A';
};

const typeColor = (t) => {
  const map = {
    'Personal Story': '#E85D4A',
    'Thought Leadership': '#4A90D9',
    Announcement: '#9B6FCF',
    Educational: '#D4A843',
    Engagement: '#6B8F71',
  };
  return map[t] || '#8A8A8A';
};

const platformColor = (p) => {
  const map = {
    Reels: '#E85D4A',
    LinkedIn: '#4A90D9',
    Facebook: '#3b5998',
    Instagram: '#9B6FCF',
    'Business Pages': '#6B8F71',
    'Trial Reels': '#D4A843',
  };
  return map[p] || '#8A8A8A';
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

function SmallButton({ children, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer font-body transition-all"
      style={{
        background: 'transparent',
        color: danger ? '#E85D4A' : '#A89F96',
        border: 'none',
        fontSize: 12,
        fontWeight: 500,
        padding: '4px 8px',
        borderRadius: 6,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = danger ? '#E85D4A12' : '#EDE9E4')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </button>
  );
}

const statusFilters = ['Not started', 'Needs Image', 'Drafted', 'Scheduled', 'Posted'];

export default function ContentCalendar({ contentData }) {
  const {
    content, loading, saving, error, clearError,
    addContent, editContent, removeContent,
  } = contentData;

  const [expandedId, setExpandedId] = useState(null);
  const [showPosted, setShowPosted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  const filtered = showPosted
    ? content
    : content.filter((c) => c.status !== 'Posted');

  const postedCount = content.filter((c) => c.status === 'Posted').length;

  const handleAdd = async (data) => {
    setShowAddModal(false);
    await addContent(data);
  };

  const handleEdit = async (data) => {
    const pageId = editingItem.id;
    setEditingItem(null);
    await editContent(pageId, data);
  };

  const handleDelete = async () => {
    const pageId = deletingItem.id;
    setDeletingItem(null);
    await removeContent(pageId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-charcoal/40">Loading content calendar...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Error banner */}
      {error && (
        <div
          style={{
            background: '#E85D4A14',
            border: '1px solid #E85D4A40',
            borderRadius: 10,
            padding: '10px 16px',
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 13,
            color: '#E85D4A',
          }}
        >
          <span>{error}</span>
          <button
            onClick={clearError}
            style={{
              background: 'none',
              border: 'none',
              color: '#E85D4A',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 700,
              padding: '0 4px',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Header row: title + add button + posted toggle */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-[22px] font-medium m-0">Content Calendar</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="cursor-pointer font-body transition-all"
            style={{
              background: '#2C2825',
              color: '#F7F4F0',
              border: 'none',
              borderRadius: 20,
              padding: '6px 16px',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            + Add Content
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPosted((v) => !v)}
            className="cursor-pointer font-body transition-all"
            style={{
              background: showPosted ? '#6B8F71' : '#F7F4F0',
              color: showPosted ? '#fff' : '#6B6560',
              border: '1px solid #E8E4DF',
              borderRadius: 20,
              padding: '6px 16px',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {showPosted ? 'Hide' : 'Show'} Posted
            {postedCount > 0 && (
              <span className="ml-1.5 opacity-60">({postedCount})</span>
            )}
          </button>
        </div>
      </div>

      {/* Status filter summary */}
      <div className="flex flex-wrap gap-2 mb-4">
        {statusFilters.map((s) => {
          const count = content.filter((c) => c.status === s).length;
          if (s === 'Posted' && !showPosted) return null;
          return (
            <div key={s} className="flex items-center gap-1.5">
              <div className="rounded-full" style={{ width: 8, height: 8, background: statusColor(s) }} />
              <span className="text-[12px] text-text-secondary">
                {s} <span className="font-semibold">{count}</span>
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filtered.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <div
              key={item.id}
              className="bg-white rounded-[14px] border border-border transition-all hover:shadow-sm"
              style={{ padding: '20px 22px' }}
            >
              {/* Header: title + type badge + actions */}
              <div className="flex justify-between items-start mb-2.5">
                <div
                  className="text-[15px] font-semibold flex-1 leading-snug cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  {item.title}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {item.type && <Badge color={typeColor(item.type)}>{item.type}</Badge>}
                  <SmallButton onClick={() => setEditingItem(item)}>Edit</SmallButton>
                  <SmallButton danger onClick={() => setDeletingItem(item)}>Delete</SmallButton>
                </div>
              </div>

              {/* Status + platform badges */}
              <div className="flex flex-wrap gap-2 mb-2.5">
                <Badge color={statusColor(item.status)}>{item.status}</Badge>
                {item.platforms?.map((p) => (
                  <Badge key={p} color={platformColor(p)}>{p}</Badge>
                ))}
              </div>

              {/* Date */}
              <div className="flex gap-5 text-xs text-text-secondary">
                {item.dateScheduled && (
                  <span>
                    Scheduled:{' '}
                    {new Date(item.dateScheduled).toLocaleDateString('en-US', {
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

        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 text-charcoal/30">
            No content items found.
          </div>
        )}
      </div>

      {/* Connected-to footer */}
      <div className="mt-4 py-3.5 px-5 bg-surface rounded-[10px] text-[13px] text-text-secondary text-center">
        {saving ? (
          <span>Saving...</span>
        ) : (
          <span>Connected to: <strong>Notion</strong> — Content ideas & scripts sync automatically</span>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <ContentFormModal onSave={handleAdd} onClose={() => setShowAddModal(false)} />
      )}
      {editingItem && (
        <ContentFormModal item={editingItem} onSave={handleEdit} onClose={() => setEditingItem(null)} />
      )}
      {deletingItem && (
        <ConfirmDialog
          message={`Delete "${deletingItem.title}"? This will archive the page in Notion.`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingItem(null)}
        />
      )}
    </div>
  );
}
