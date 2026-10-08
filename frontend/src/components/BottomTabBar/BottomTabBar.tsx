import './BottomTabBar.css'

export type TabKey = 'today' | 'markets' | 'news' | 'journal' | 'goals'

const TABS: { key: TabKey; label: string; icon: string; iconFill: string }[] = [
  { key: 'today', label: 'Today', icon: 'ph-sun-horizon', iconFill: 'ph-fill ph-sun-horizon' },
  { key: 'markets', label: 'Markets', icon: 'ph-chart-line-up', iconFill: 'ph-fill ph-chart-line-up' },
  { key: 'news', label: 'News', icon: 'ph-newspaper', iconFill: 'ph-fill ph-newspaper' },
  { key: 'journal', label: 'Journal', icon: 'ph-notebook', iconFill: 'ph-fill ph-notebook' },
  { key: 'goals', label: 'Goals', icon: 'ph-target', iconFill: 'ph-fill ph-target' },
]

interface BottomTabBarProps {
  active: TabKey
  onSelect?: (tab: TabKey) => void
}

/**
 * Shared bottom navigation, present on all six core screens. Screens 2-6
 * aren't built yet, so `onSelect` is optional — Screen 1 renders this as
 * static chrome until routing exists.
 */
export function BottomTabBar({ active, onSelect }: BottomTabBarProps) {
  return (
    <nav className="bottom-tab-bar">
      {TABS.map((tab) => {
        const isActive = tab.key === active
        return (
          <button
            key={tab.key}
            type="button"
            className="bottom-tab-bar__item"
            data-active={isActive}
            onClick={() => onSelect?.(tab.key)}
            aria-current={isActive ? 'page' : undefined}
          >
            <i className={isActive ? tab.iconFill : `ph ${tab.icon}`} aria-hidden="true" />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
