import { useState, useEffect } from 'react';

const STATUSES = ['To Do', 'In Progress', 'Done'];
const PRIORITIES = ['High', 'Medium', 'Low'];

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

export default function TaskFormModal({ task, onSave, onClose }) {
  const isEdit = !!task;

  const [form, setForm] = useState({
    task: '',
    project: '',
    category: '',
    status: 'To Do',
    priority: 'Medium',
    dueDate: '',
    notes: '',
    topTask: false,
  });

  useEffect(() => {
    if (task) {
      setForm({
        task: task.task || '',
        project: task.project || '',
        category: task.category || '',
        status: task.status || 'To Do',
        priority: task.priority || 'Medium',
        dueDate: task.dueDate || '',
        notes: task.notes || '',
        topTask: task.topTask || false,
      });
    }
  }, [task]);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.task.trim()) return;
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
          {isEdit ? 'Edit Task' : 'New Task'}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Task name */}
          <div>
            <label style={labelStyle}>Task *</label>
            <input style={inputStyle} value={form.task} onChange={set('task')} placeholder="What needs to be done?" autoFocus />
          </div>

          {/* Project + Category row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Project</label>
              <input style={inputStyle} value={form.project} onChange={set('project')} placeholder="e.g. Q1 Review" />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <input style={inputStyle} value={form.category} onChange={set('category')} placeholder="e.g. Investment" />
            </div>
          </div>

          {/* Status + Priority row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.status} onChange={set('status')}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label style={labelStyle}>Due Date</label>
            <input style={inputStyle} type="date" value={form.dueDate} onChange={set('dueDate')} />
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }}
              value={form.notes}
              onChange={set('notes')}
              placeholder="Additional details..."
            />
          </div>

          {/* Top Task checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#2C2825', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.topTask} onChange={set('topTask')} />
            Mark as Top Task
          </label>

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
              {isEdit ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
