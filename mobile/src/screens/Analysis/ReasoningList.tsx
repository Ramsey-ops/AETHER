import type { ComponentType } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { CheckCircleIcon, NewspaperClippingIcon, WarningCircleIcon, type IconProps } from 'phosphor-react-native'
import type { ReasoningKind, ReasoningPoint } from '../../types/analysis'
import { color, font } from '../../theme/tokens'

interface ReasoningListProps {
  points: ReasoningPoint[]
}

const ICON: Record<ReasoningKind, { Icon: ComponentType<IconProps>; color: string }> = {
  confirm: { Icon: CheckCircleIcon, color: color.up },
  caution: { Icon: WarningCircleIcon, color: color.caution },
  news: { Icon: NewspaperClippingIcon, color: color.accent400 },
}

export function ReasoningList({ points }: ReasoningListProps) {
  if (points.length === 0) return null

  return (
    <View>
      <Text style={styles.sectionLabel}>WHY — SMC-ITC REASONING</Text>
      <View style={styles.list}>
        {points.map((point, i) => {
          const { Icon, color: iconColor } = ICON[point.kind]
          return (
            <View key={i} style={styles.item}>
              <Icon size={17} color={iconColor} style={styles.icon} />
              <Text style={styles.text}>{point.text}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontFamily: font.regular,
    fontSize: 11,
    letterSpacing: 1.4,
    color: color.muted,
    marginTop: 22,
    marginBottom: 10,
  },
  list: {
    gap: 10,
  },
  item: {
    flexDirection: 'row',
    gap: 11,
  },
  icon: {
    marginTop: 1,
  },
  text: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 20,
    color: color.text2,
  },
})
