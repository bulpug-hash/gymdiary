// Shell aplikace — kit 247, skládaný na telefon.
// Horní lišta drží značku a stav týdne, spodní navigace je v dosahu palce.
import { useEffect, useState } from 'react';
import Overview from '@/components/Overview';
import Plan from '@/components/Plan';
import Guide from '@/components/Guide';
import Diary from '@/components/Diary';
import Progress from '@/components/Progress';
import Tools from '@/components/Tools';
import { NavIcon, QuoteBar, RestBar, UpdateBar } from '@/components/kit';
import type { NavIconKey } from '@/components/kit';
import { useWorkoutData } from '@/hooks/useWorkoutData';
import { useTheme } from '@/contexts/ThemeContext';
import { getCurrentWeek } from '@/lib/data';
import type { Tab } from '@/lib/types';
export type { Tab };

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'overview', label: 'Přehled', icon: '01' },
  { key: 'plan', label: 'Plán', icon: '02' },
  { key: 'guide', label: 'Průvodce', icon: '03' },
  { key: 'diary', label: 'Deník', icon: '04' },
  { key: 'progress', label: 'Progres', icon: '05' },
  { key: 'tools', label: 'Nástroje', icon: '06' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const workoutData = useWorkoutData();
  const { theme, toggleTheme } = useTheme();

  // Přepnutí záložky vždy začíná nahoře – jinak přistaneš uprostřed cizí stránky.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab]);

  const week = getCurrentWeek();

  return (
    <div className="gd-shell">
      <div className="gd-topbar">
        <span className="gd-topbar__side">T{String(week).padStart(2, '0')} / 13</span>
        <span className="gd-topbar__brand">Gymdiary</span>
        <span className="gd-topbar__side gd-topbar__side--r">
          {toggleTheme ? (
            <button className="gd-topbar__btn" onClick={toggleTheme}>
              {theme === 'dark' ? 'Světlý' : 'Tmavý'}
            </button>
          ) : 'Podzim ’26'}
        </span>
      </div>

      <QuoteBar />

      <UpdateBar />

      <main className="gd-main">
        <div className="gd-scroll">
          {activeTab === 'overview' && <Overview workoutData={workoutData} onNavigate={setActiveTab} />}
          {activeTab === 'plan' && <Plan workoutData={workoutData} />}
          {activeTab === 'guide' && <Guide />}
          {activeTab === 'diary' && <Diary workoutData={workoutData} />}
          {activeTab === 'progress' && <Progress workoutData={workoutData} />}
          {activeTab === 'tools' && <Tools workoutData={workoutData} />}
        </div>
      </main>

      <RestBar />

      <nav className="gd-tabbar" aria-label="Hlavní navigace">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className="gd-tabbar__btn"
            data-on={activeTab === tab.key ? '1' : '0'}
            aria-current={activeTab === tab.key ? 'page' : undefined}
            onClick={() => setActiveTab(tab.key)}
          >
            <NavIcon name={tab.key as NavIconKey} active={activeTab === tab.key} />
            <span className="gd-tabbar__lbl">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
