import { StyleSheet, View } from 'react-native'
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg'
import type { Candle } from '../../types/analysis'
import { color } from '../../theme/tokens'

interface SparklineProps {
  candles: Candle[]
  width?: number
  height?: number
  up: boolean
}

function buildPath(closes: number[], width: number, height: number): { line: string; fill: string } {
  const min = Math.min(...closes)
  const max = Math.max(...closes)
  const range = max - min || 1
  const stepX = width / (closes.length - 1 || 1)

  const points = closes.map((c, i) => {
    const x = i * stepX
    const y = height - ((c - min) / range) * height
    return [x, y] as const
  })

  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const fill = `${line} L${width} ${height} L0 ${height} Z`
  return { line, fill }
}

/** Real sparkline drawn from live candle closes — no synthetic data. Renders
 * nothing (caller should show a placeholder) when there aren't enough
 * candles to draw a line. */
export function Sparkline({ candles, width = 320, height = 40, up }: SparklineProps) {
  if (candles.length < 2) return null

  const { line, fill } = buildPath(
    candles.map((c) => c.close),
    width,
    height,
  )
  const stroke = up ? color.up : color.down

  return (
    <View style={styles.wrap}>
      <Svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
        <Defs>
          <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={stroke} stopOpacity={0.32} />
            <Stop offset="1" stopColor={stroke} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={fill} fill="url(#sparkFill)" />
        <Path d={line} fill="none" stroke={stroke} strokeWidth={1.8} strokeLinejoin="round" />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginVertical: 10,
  },
})
