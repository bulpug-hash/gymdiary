// Gold Performance Design – Main App Shell
// Bottom tab navigation: Přehled | Plán | Průvodce | Deník | Progres | Nástroje
import { useState } from 'react';
import Overview from '@/components/Overview';
import Plan from '@/components/Plan';
import Guide from '@/components/Guide';
import Diary from '@/components/Diary';
import Progress from '@/components/Progress';
import Tools from '@/components/Tools';
import { useWorkoutData } from '@/hooks/useWorkoutData';
import { useTheme } from '@/contexts/ThemeContext';
import type { Tab } from '@/lib/types';
export type { Tab };

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'overview', label: 'Přehled', icon: '⚡' },
  { key: 'plan', label: 'Plán', icon: '📋' },
  { key: 'guide', label: 'Průvodce', icon: '📖' },
  { key: 'diary', label: 'Deník', icon: '📓' },
  { key: 'progress', label: 'Progres', icon: '📈' },
  { key: 'tools', label: 'Nástroje', icon: '🔧' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const workoutData = useWorkoutData();
  const { theme } = useTheme();

  const isDark = theme === 'dark';
  const bg = isDark ? '#0c0c0c' : '#f5f5f0';
  const tabBg = isDark ? 'rgba(12,12,12,0.97)' : 'rgba(245,245,240,0.97)';
  const tabBorder = isDark ? '#1c1c1c' : '#e0e0d8';

  return (
    <div style={{
      minHeight: '100dvh',
      maxWidth: 480,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      background: bg,
      position: 'relative',
      transition: 'background 0.3s ease',
    }}>
      {/* Main content area */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 72 }}>
        {activeTab === 'overview' && <Overview workoutData={workoutData} onNavigate={setActiveTab} />}
        {activeTab === 'plan' && <Plan workoutData={workoutData} />}
        {activeTab === 'guide' && <Guide />}
        {activeTab === 'diary' && <Diary workoutData={workoutData} />}
        {activeTab === 'progress' && <Progress workoutData={workoutData} />}
        {activeTab === 'tools' && <Tools workoutData={workoutData} />}
      </div>

      {/* Bottom tab bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        display: 'flex',
        background: tabBg,
        borderTop: `1px solid ${tabBorder}`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: '10px 0 8px',
              background: 'none',
              border: 'none',
              borderTop: activeTab === tab.key ? '2px solid #F5C842' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>{tab.icon}</span>
            <span style={{
              fontSize: 9,
              fontWeight: activeTab === tab.key ? 700 : 400,
              color: activeTab === tab.key ? '#F5C842' : (isDark ? '#555' : '#999'),
              letterSpacing: '0.02em',
              transition: 'color 0.15s ease',
            }}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
