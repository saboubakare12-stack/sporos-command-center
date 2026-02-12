import { useState } from 'react';
import TaskFormModal from './TaskFormModal';
import ConfirmDialog from './ConfirmDialog';

const priorityColor = (p) => {
  if (p === 'High') return '#E85D4A';
  if (p === 'Medium') return '#D4A843';
  return '#6B8F71';
};

const statusColor = (s) => {
  const map = {
    'To Do': '#8A8A8A',
    'In Progress': '#4A90D9',
    'Done': '#6B8F71',
  };
  return map[s] || '#8A8A8A';
};

const statusFilters = ['All', 'To Do', 'In Progress', 'Done'];

function Badge({ color, children, onClick }) {
  return (
    <span
      onClick={onClick}
      className="text-[11px] font-semibold rounded-full whitespace-nowrap uppercase"
      style={{
        background: color + '18',
        color,
        padding: '3px 10px',
        letterSpacing: 0.3,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'filter 0.15s',
      }}
      title={onClick ? 'Click to cycle status' : undefined}
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

export default function TaskTracker({ taskData }) {
  const {
    tasks, loading, saving, error, clearError,
    addTask, editTask, changeStatus, removeTask,
  } = taskData;

  const [filter, setFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);

  const filtered = filter === 'All' ? tasks : tasks.filter((t) => t.status === filter);

  const handleAdd = async (data) => {
    setShowAddModal(false);
    await addTask(data);
  };

  const handleEdit = async (data) => {
    const sheetRow = editingTask.sheetRow;
    setEditingTask(null);
    await editTask(sheetRow, data);
  };

  const handleDelete = async () => {
    const sheetRow = deletingTask.sheetRow;
    setDeletingTask(null);
    await removeTask(sheetRow);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-charcoal/40">Loading tasks...</p>
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

      {/* Header row: title + add button + filters */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-[22px] font-medium m-0">Task Tracker</h2>
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
            + Add Task
          </button>
        </div>
        <div className="flex gap-2">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="cursor-pointer font-body transition-all"
              style={{
                background: filter === s ? '#2C2825' : '#F7F4F0',
                color: filter === s ? '#F7F4F0' : '#6B6560',
                border: '1px solid #E8E4DF',
                borderRadius: 20,
                padding: '6px 16px',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {s}
              {s !== 'All' && (
                <span className="ml-1.5 opacity-60">
                  ({tasks.filter((t) => t.status === s).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div className="flex flex-col gap-2.5">
        {filtered.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-[14px] border border-border"
            style={{ padding: '20px 22px' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5 flex-1">
                {/* Priority bar */}
                <div
                  className="shrink-0 rounded-sm"
                  style={{
                    width: 4,
                    height: 36,
                    background: priorityColor(task.priority),
                  }}
                />
                <div className="flex-1">
                  <div
                    className="text-[15px] font-medium"
                    style={{
                      color: task.status === 'Done' ? '#A89F96' : '#2C2825',
                      textDecoration: task.status === 'Done' ? 'line-through' : 'none',
                    }}
                  >
                    {task.task}
                  </div>
                  <div className="flex gap-2 mt-1.5">
                    <Badge
                      color={statusColor(task.status)}
                      onClick={task.sheetRow ? () => changeStatus(task.sheetRow, task.status) : undefined}
                    >
                      {task.status}
                    </Badge>
                    <Badge color="#8A8A8A">{task.category}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <div className="text-right">
                  <div className="text-[13px] text-text-secondary font-medium">
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : ''}
                  </div>
                  <div
                    className="text-[11px] mt-0.5 capitalize"
                    style={{ color: priorityColor(task.priority) }}
                  >
                    {task.priority}
                  </div>
                </div>
                {task.sheetRow && (
                  <div className="flex gap-0.5">
                    <SmallButton onClick={() => setEditingTask(task)}>Edit</SmallButton>
                    <SmallButton danger onClick={() => setDeletingTask(task)}>Delete</SmallButton>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-charcoal/30">
            No tasks match this filter.
          </div>
        )}
      </div>

      {/* Connected-to footer */}
      <div className="mt-4 py-3.5 px-5 bg-surface rounded-[10px] text-[13px] text-text-secondary text-center">
        {saving ? (
          <span>Saving...</span>
        ) : (
          <span>📊 Connected to: <strong>Google Sheets</strong> — Tasks sync automatically</span>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <TaskFormModal onSave={handleAdd} onClose={() => setShowAddModal(false)} />
      )}
      {editingTask && (
        <TaskFormModal task={editingTask} onSave={handleEdit} onClose={() => setEditingTask(null)} />
      )}
      {deletingTask && (
        <ConfirmDialog
          message={`Delete "${deletingTask.task}"? This will remove the row from your Google Sheet.`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingTask(null)}
        />
      )}
    </div>
  );
}
