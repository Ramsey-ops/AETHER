import type { ComponentType } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ChartLineUpIcon,
  NewspaperIcon,
  NotebookIcon,
  SunHorizonIcon,
  TargetIcon,
  type IconProps,
} from 'phosphor-react-native'
import { color } from '../../theme/tokens'

export type TabKey = 'today' | 'markets' | 'news' | 'journal' | 'goals'

const TABS: { key: TabKey; label: string; Icon: ComponentType<IconProps> }[] = [
  { key: 'today', label: 'Today', Icon: SunHorizonIcon },
  { key: 'markets', label: 'Markets', Icon: ChartLineUpIcon },
  { key: 'news', label: 'News', Icon: NewspaperIcon },
  { key: 'journal', label: 'Journal', Icon: NotebookIcon },
  { key: 'goals', label: 'Goals', Icon: TargetIcon },
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
  const insets = useSafeAreaInsets()

  return (
    <BlurView
      intensity={40}
      tint="dark"
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active
        return (
          <Pressable
            key={tab.key}
            style={styles.item}
            onPress={() => onSelect?.(tab.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <tab.Icon
              size={21}
              color={isActive ? color.accent400 : color.muted}
              weight={isActive ? 'fill' : 'regular'}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        )
      })}
    </BlurView>
  )
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    paddingTop: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(233, 233, 237, 0.1)',
    backgroundColor: 'rgba(22, 24, 38, 0.75)',
    overflow: 'hidden',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  label: {
    fontSize: 10.5,
    color: color.muted,
  },
  labelActive: {
    color: color.accent400,
  },
})
