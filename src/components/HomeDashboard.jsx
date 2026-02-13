const priorityColor = (p) => {
  if (p === 'High') return '#E85D4A';
  if (p === 'Medium') return '#D4A843';
  return '#6B8F71';
};

const statusColor = (s) => {
  const map = {
    'To Do': '#8A8A8A',
    'In Progress': '#4A90D9',
    Done: '#6B8F71',
  };
  return map[s] || '#8A8A8A';
};

const contentStatusColor = (s) => {
  const map = {
    'Not started': '#8A8A8A',
    'Needs Image': '#E85D4A',
    Drafted: '#4A90D9',
    Scheduled: '#D4A843',
    Posted: '#6B8F71',
  };
  return map[s] || '#8A8A8A';
};

const touchpointTypeIcons = {
  Birthday: '🎂',
  Anniversary: '💍',
  'Annual Review': '📋',
};

const touchpointTypeColor = (t) => {
  const map = {
    Birthday: '#E85D4A',
    Anniversary: '#9B6FCF',
    'Annual Review': '#4A90D9',
  };
  return map[t] || '#8A8A8A';
};

function daysUntil(dateStr) {
  if (!dateStr) return Infinity;
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

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

function SectionCard({ title, children, onViewAll }) {
  return (
    <div
      className="bg-white rounded-[14px] border border-border flex flex-col"
      style={{ padding: '20px 22px' }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-heading text-[16px] font-medium m-0">{title}</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="bg-transparent border-none cursor-pointer font-body text-[12px] font-medium transition-all"
            style={{ color: '#D4A843', padding: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#B8922E')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#D4A843')}
          >
            View all →
          </button>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function ProgressBar({ value, max, color = '#D4A843' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ width: '100%', height: 6, background: '#EDE9E4', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s' }} />
    </div>
  );
}

// === SECTION: Today's Focus ===
function TodaysFocus({ tasks }) {
  const topTasks = tasks
    .filter((t) => t.topTask && t.status !== 'Done')
    .slice(0, 3);

  if (topTasks.length === 0) {
    return (
      <div
        className="bg-white rounded-[14px] border border-border"
        style={{ padding: '20px 22px' }}
      >
        <h3 className="font-heading text-[16px] font-medium m-0 mb-3">Today's Focus</h3>
        <p className="text-[13px] text-text-muted m-0">No top tasks set. Mark tasks as "Top Task" to see them here.</p>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-[14px] border border-border"
      style={{ padding: '20px 22px', borderLeft: '4px solid #D4A843' }}
    >
      <h3 className="font-heading text-[16px] font-medium m-0 mb-3">Today's Focus</h3>
      <div className="flex flex-col gap-2">
        {topTasks.map((task) => (
          <div key={task.id} className="flex items-center gap-3">
            <div
              className="shrink-0 rounded-sm"
              style={{ width: 4, height: 28, background: priorityColor(task.priority) }}
            />
            <div className="flex-1 text-[14px] font-medium" style={{ color: '#2C2825' }}>
              {task.task}
            </div>
            <Badge color={statusColor(task.status)}>{task.status}</Badge>
            <span className="text-[12px] text-text-secondary shrink-0">
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// === SECTION: Tasks Summary ===
function TasksSummary({ tasks, onNavigate }) {
  const todo = tasks.filter((t) => t.status === 'To Do').length;
  const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
  const done = tasks.filter((t) => t.status === 'Done').length;
  const total = tasks.length;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const overdue = tasks.filter((t) => {
    if (!t.dueDate || t.status === 'Done') return false;
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < now;
  }).length;

  const dueToday = tasks.filter((t) => {
    if (!t.dueDate || t.status === 'Done') return false;
    return daysUntil(t.dueDate) === 0;
  });

  return (
    <SectionCard title="Tasks" onViewAll={() => onNavigate('tasks')}>
      <div className="flex gap-4 mb-3">
        <div className="text-center flex-1">
          <div className="text-[20px] font-semibold" style={{ color: '#8A8A8A' }}>{todo}</div>
          <div className="text-[11px] text-text-muted uppercase">To Do</div>
        </div>
        <div className="text-center flex-1">
          <div className="text-[20px] font-semibold" style={{ color: '#4A90D9' }}>{inProgress}</div>
          <div className="text-[11px] text-text-muted uppercase">In Progress</div>
        </div>
        <div className="text-center flex-1">
          <div className="text-[20px] font-semibold" style={{ color: '#6B8F71' }}>{done}</div>
          <div className="text-[11px] text-text-muted uppercase">Done</div>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-[11px] text-text-muted mb-1">
          <span>Progress</span>
          <span>{total > 0 ? Math.round((done / total) * 100) : 0}%</span>
        </div>
        <ProgressBar value={done} max={total} color="#6B8F71" />
      </div>

      {overdue > 0 && (
        <div className="mb-3">
          <Badge color="#E85D4A">{overdue} overdue</Badge>
        </div>
      )}

      {dueToday.length > 0 && (
        <div>
          <div className="text-[11px] text-text-muted uppercase font-semibold mb-1.5">Due Today</div>
          {dueToday.map((task) => (
            <div key={task.id} className="flex items-center gap-2 mb-1.5">
              <div
                className="shrink-0 rounded-sm"
                style={{ width: 3, height: 20, background: priorityColor(task.priority) }}
              />
              <span className="text-[12px] text-text-secondary flex-1 truncate">{task.task}</span>
              <Badge color={statusColor(task.status)}>{task.status}</Badge>
            </div>
          ))}
        </div>
      )}

      {dueToday.length === 0 && overdue === 0 && (
        <div className="text-[12px] text-text-muted">No tasks due today</div>
      )}
    </SectionCard>
  );
}

// === SECTION: Content Pipeline ===
function ContentPipeline({ content, onNavigate }) {
  const statuses = ['Not started', 'Needs Image', 'Drafted', 'Scheduled', 'Posted'];
  const statusCounts = {};
  statuses.forEach((s) => {
    statusCounts[s] = content.filter((c) => c.status === s).length;
  });

  // Count unique platforms across all content
  const platformCounts = {};
  content.forEach((c) => {
    (c.platforms || []).forEach((p) => {
      platformCounts[p] = (platformCounts[p] || 0) + 1;
    });
  });

  const upcoming = content.filter((c) => {
    if (!c.dateScheduled) return false;
    const days = daysUntil(c.dateScheduled);
    return days >= 0 && days <= 7;
  });

  return (
    <SectionCard title="Content Pipeline" onViewAll={() => onNavigate('content')}>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-3">
        {statuses.map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className="rounded-full" style={{ width: 8, height: 8, background: contentStatusColor(s) }} />
            <span className="text-[12px] text-text-secondary">
              {s} <span className="font-semibold">{statusCounts[s]}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {Object.entries(platformCounts).map(([platform, count]) => (
          <Badge key={platform} color="#8A8A8A">{count} {platform}</Badge>
        ))}
      </div>

      {upcoming.length > 0 && (
        <div className="text-[12px] text-text-secondary">
          <span className="font-medium">Scheduled this week:</span>
          {upcoming.map((c) => (
            <div key={c.id} className="ml-2 mt-1">
              📅 {c.title} —{' '}
              {new Date(c.dateScheduled).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          ))}
        </div>
      )}

      {content.length === 0 && (
        <p className="text-[13px] text-text-muted m-0">No content items yet.</p>
      )}
    </SectionCard>
  );
}

// === SECTION: Upcoming Touchpoints ===
function TouchpointsSummary({ touchpoints, onNavigate }) {
  const sorted = [...touchpoints]
    .sort((a, b) => daysUntil(a.date) - daysUntil(b.date));

  const pastDue = sorted.filter((tp) => daysUntil(tp.date) < 0);
  const upcoming = sorted.filter((tp) => daysUntil(tp.date) >= 0).slice(0, 3);

  return (
    <SectionCard title="Upcoming Touchpoints" onViewAll={() => onNavigate('touchpoints')}>
      {pastDue.length > 0 && (
        <div className="mb-3">
          <Badge color="#E85D4A">{pastDue.length} past due</Badge>
        </div>
      )}

      {upcoming.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {upcoming.map((tp) => {
            const days = daysUntil(tp.date);
            const urgencyColor = days <= 3 ? '#E85D4A' : days <= 7 ? '#D4A843' : '#6B8F71';
            const color = touchpointTypeColor(tp.type);
            return (
              <div key={tp.id} className="flex items-center gap-3">
                <div
                  className="shrink-0 rounded-full flex items-center justify-center text-sm"
                  style={{ width: 32, height: 32, background: color + '15' }}
                >
                  {touchpointTypeIcons[tp.type] || '📅'}
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold">{tp.clientName}</div>
                  <Badge color={color}>{tp.type}</Badge>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[12px] font-semibold" style={{ color: urgencyColor }}>
                    {days === 0 ? 'Today' : `${days}d away`}
                  </div>
                  <div className="text-[11px] text-text-muted">
                    {tp.date
                      ? new Date(tp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[13px] text-text-muted m-0">No upcoming touchpoints.</p>
      )}
    </SectionCard>
  );
}

// === MAIN DASHBOARD ===
export default function HomeDashboard({ tasks, content, touchpoints, onNavigate }) {
  return (
    <div>
      {/* Today's Focus — full width */}
      <div className="mb-6">
        <TodaysFocus tasks={tasks} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TasksSummary tasks={tasks} onNavigate={onNavigate} />
        <ContentPipeline content={content} onNavigate={onNavigate} />
        <TouchpointsSummary touchpoints={touchpoints} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
