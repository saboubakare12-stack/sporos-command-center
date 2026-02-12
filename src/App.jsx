import { useState } from 'react';
import Header from './components/Header';
import TabNav from './components/TabNav';
import TaskTracker from './components/TaskTracker';
import ContentCalendar from './components/ContentCalendar';
import MarketPulse from './components/MarketPulse';
import ClientTouchpoints from './components/ClientTouchpoints';
import HomeDashboard from './components/HomeDashboard';
import { useMarketData } from './hooks/useMarketData';
import { useContent } from './hooks/useContent';
import { useTouchpoints } from './hooks/useTouchpoints';
import { useTasks } from './hooks/useTasks';

function daysUntil(dateStr) {
  if (!dateStr) return Infinity;
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const market = useMarketData();
  const { content } = useContent();
  const { touchpoints } = useTouchpoints();
  const taskData = useTasks();

  // Count touchpoints within 7 days
  const touchpointsThisWeek = touchpoints.filter(
    (tp) => daysUntil(tp.date) >= 0 && daysUntil(tp.date) <= 7
  ).length;

  return (
    <div className="min-h-screen bg-warm-white">
      <Header
        quotes={market.quotes}
        sparklines={market.sparklines}
        touchpointsThisWeek={touchpointsThisWeek}
        config={market.config}
      />

      <TabNav active={activeTab} onChange={setActiveTab} />

      <main className="max-w-[1100px] mx-auto" style={{ padding: '28px 36px' }}>
        {activeTab === 'home' && (
          <HomeDashboard
            tasks={taskData.tasks}
            content={content}
            touchpoints={touchpoints}
            market={market}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === 'tasks' && <TaskTracker taskData={taskData} />}
        {activeTab === 'content' && <ContentCalendar />}
        {activeTab === 'market' && (
          <MarketPulse
            quotes={market.quotes}
            marketOpen={market.marketOpen}
            lastUpdated={market.lastUpdated}
            onRefresh={market.refresh}
            config={market.config}
          />
        )}
        {activeTab === 'touchpoints' && <ClientTouchpoints />}
      </main>

      {/* Footer */}
      <div className="text-center text-xs text-text-muted" style={{ padding: '20px 36px 32px' }}>
        Sporos Command Center · Data sources: Google Sheets, Notion, Yahoo Finance API · Built with Claude Code
      </div>
    </div>
  );
}
