import { useState, useEffect } from 'react';

const TYPES = ['Personal Story', 'Thought Leadership', 'Announcement', 'Educational', 'Engagement'];
const STATUSES = ['Not started', 'Needs Image', 'Drafted', 'Scheduled', 'Posted'];
const PLATFORM_OPTIONS = ['Reels', 'LinkedIn', 'Facebook', 'Instagram', 'Business Pages', 'Trial Reels'];

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  fontSize: 14,
  fontFamily: 'inherit',
  border: '1px solid #E5E0DA',
  borderRadius: 10,
  background: '#F7F4F0',
  color: '#2C2825',
  outline: 'none',
};

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#6B6560',
  marginBottom: 4,
};

export default function ContentFormModal({ item, onSave, onClose }) {
  const isEdit = !!item;

  const [form, setForm] = useState({
    title: '',
    type: 'Educational',
    status: 'Not started',
    dateScheduled: '',
    platforms: [],
    script: '',
  });

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title || '',
        type: item.type || 'Educational',
        status: item.status || 'Not started',
        dateScheduled: item.dateScheduled || '',
        platforms: item.platforms || [],
        script: item.script || '',
      });
    }
  }, [item]);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const togglePlatform = (platform) => {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(platform)
        ? f.platforms.filter((p) => p !== platform)
        : [...f.platforms, platform],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(44,40,37,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 16,
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px 28px 20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        }}
      >
        <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600, color: '#2C2825' }}>
          {isEdit ? 'Edit Content' : 'New Content'}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>Title *</label>
            <input style={inputStyle} value={form.title} onChange={set('title')} placeholder="Post title or idea" autoFocus />
          </div>

          {/* Type + Status row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Type</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.type} onChange={set('type')}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.status} onChange={set('status')}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Date Scheduled */}
          <div>
            <label style={labelStyle}>Date Scheduled</label>
            <input style={inputStyle} type="date" value={form.dateScheduled} onChange={set('dateScheduled')} />
          </div>

          {/* Platforms */}
          <div>
            <label style={labelStyle}>Platforms</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PLATFORM_OPTIONS.map((p) => (
                <label
                  key={p}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 13,
                    color: '#2C2825',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.platforms.includes(p)}
                    onChange={() => togglePlatform(p)}
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>

          {/* Script / Instructions */}
          <div>
            <label style={labelStyle}>Script / Instructions</label>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              value={form.script}
              onChange={set('script')}
              placeholder="Content outline, script, or notes..."
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 20px',
                fontSize: 13,
                fontWeight: 500,
                border: '1px solid #E5E0DA',
                borderRadius: 10,
                background: '#F7F4F0',
                color: '#6B6560',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '9px 20px',
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                borderRadius: 10,
                background: '#2C2825',
                color: '#F7F4F0',
                cursor: 'pointer',
              }}
            >
              {isEdit ? 'Save Changes' : 'Add Content'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
