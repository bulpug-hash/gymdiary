// Shell aplikace — kit 247, skládaný na telefon.
// Horní lišta drží značku a stav týdne, spodní navigace je v dosahu palce.
import { useEffect, useRef, useState } from 'react';
import Overview from '@/components/Overview';
import Plan from '@/components/Plan';
import Guide from '@/components/Guide';
import Diary from '@/components/Diary';
import Progress from '@/components/Progress';
import Tools from '@/components/Tools';
import { NavIcon, RestBar, UpdateBar } from '@/components/kit';
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

  // Každá záložka si drží, kde jsi v ní skončil. Dřív se skákalo natvrdo
  // nahoru, takže odskok z půlky Plánu na Deník a zpátky znamenal rolovat
  // znovu od začátku. Návrat do rozdělaného je to, co dělají appky od Applu.
  const pozice = useRef<Partial<Record<Tab, number>>>({});
  const predchozi = useRef<Tab>(activeTab);

  const prepni = (tab: Tab) => {
    if (tab === activeTab) {
      // Druhý tap na aktivní záložku vyroluje nahoru – stejné gesto jako
      // tap na stavový řádek v iOSu.
      window.scrollTo({ top: 0, behavior: 'smooth' });
      pozice.current[tab] = 0;
      return;
    }
    pozice.current[activeTab] = window.scrollY;
    setActiveTab(tab);
  };

  // Proklik z Přehledu ("ukaž mi plán tohohle dne") má přistát nahoře, ne tam,
  // kde jsi cílovou záložku naposled opustil – proto se uložená pozice nuluje.
  const prejdiNa = (tab: Tab) => {
    pozice.current[activeTab] = window.scrollY;
    pozice.current[tab] = 0;
    setActiveTab(tab);
  };

  useEffect(() => {
    if (predchozi.current === activeTab) return;
    predchozi.current = activeTab;
    // Obsah se musí stihnout vykreslit, jinak není kam rolovat.
    const id = requestAnimationFrame(() => {
      window.scrollTo({ top: pozice.current[activeTab] ?? 0, behavior: 'auto' });
    });
    return () => cancelAnimationFrame(id);
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


      <UpdateBar />

      <main className="gd-main">
        <div className="gd-scroll">
          {activeTab === 'overview' && <Overview workoutData={workoutData} onNavigate={prejdiNa} />}
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
            onClick={() => prepni(tab.key)}
          >
            <NavIcon name={tab.key as NavIconKey} active={activeTab === tab.key} />
            <span className="gd-tabbar__lbl">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
