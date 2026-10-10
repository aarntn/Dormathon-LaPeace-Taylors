import homeGrey from '../assets/figma/home-grey.svg';
import homeWhite from '../assets/figma/home-white.svg';
import tripsGrey from '../assets/figma/trips-grey.svg';
import tripsWhite from '../assets/figma/trips-white.svg';
import carGrey from '../assets/figma/car-grey.svg';
import carWhite from '../assets/figma/car-white.svg';
import profileGrey from '../assets/figma/profile-grey.svg';
import profileWhite from '../assets/figma/profile-white.svg';

export const tabs = ['Home', 'Trips', 'Car', 'Profile'] as const;
export type Tab = typeof tabs[number];
export type TabBarProps = { active?: Tab; onChange?: (tab: Tab) => void; className?: string };
const artwork = { Home: [homeGrey, homeWhite], Trips: [tripsGrey, tripsWhite], Car: [carGrey, carWhite], Profile: [profileGrey, profileWhite] };

export function TabBar({ active = 'Home', onChange, className = '' }: TabBarProps) {
  return <nav aria-label="Main navigation" className={`tab-bar ${className}`}>
    {tabs.map(tab => <button key={tab} type="button" aria-label={tab} aria-current={tab === active ? 'page' : undefined}
      className={`tab-bar__tab ${tab === active ? 'tab-bar__tab--active' : ''}`} onClick={() => onChange?.(tab)}>
      <span className="tab-icon-slot"><img src={artwork[tab][tab === active ? 1 : 0]} alt="" /></span>
    </button>)}
  </nav>;
}
