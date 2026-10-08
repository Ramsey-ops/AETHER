import { StyleSheet, Text, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { color, font } from '../../theme/tokens'

interface ConfidenceRingProps {
  confidence: number | null
  size?: number
  ringColor?: string
}

export function ConfidenceRing({ confidence, size = 76, ringColor = color.up }: ConfidenceRingProps) {
  const strokeWidth = 6
  const radius = size / 2 - strokeWidth
  const circumference = 2 * Math.PI * radius
  const filled = confidence != null ? (confidence / 100) * circumference : 0

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(233, 233, 237, 0.12)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {confidence != null && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
            fill="none"
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        )}
      </Svg>
      <View style={styles.center}>
        <Text style={styles.value}>{confidence ?? '—'}</Text>
        <Text style={styles.label}>CONF</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: font.semibold,
    fontSize: 21,
    color: color.text,
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontFamily: font.regular,
    fontSize: 9.5,
    letterSpacing: 1,
    color: color.muted,
  },
})
