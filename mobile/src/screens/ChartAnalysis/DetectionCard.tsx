import { Image, StyleSheet, Text, View } from 'react-native'
import type { ChartDetection } from '../../types/chartAnalysis'
import { resolveMediaUrl } from '../../lib/api'
import { color, font, radius } from '../../theme/tokens'

interface DetectionCardProps {
  screenshotUrl: string
  detection: ChartDetection
  statusLabel: string
}

export function DetectionCard({ screenshotUrl, detection, statusLabel }: DetectionCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: resolveMediaUrl(screenshotUrl) }} style={styles.image} resizeMode="cover" />
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>{statusLabel}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Detected pair</Text>
          <Text style={styles.cellValue}>{detection.pair ?? '—'}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Timeframe</Text>
          <Text style={styles.cellValue}>{detection.timeframe ?? '—'}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Source</Text>
          <Text style={styles.cellValue}>{detection.source ?? '—'}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.16)',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: color.sunken,
  },
  imageWrap: {
    height: 138,
    backgroundColor: color.sunken,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  statusPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 99,
    backgroundColor: 'rgba(15, 16, 24, 0.8)',
    borderWidth: 1,
    borderColor: color.up,
  },
  statusPillText: {
    fontFamily: font.regular,
    fontSize: 11,
    color: color.up,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    backgroundColor: color.raised,
    padding: 11,
    borderTopWidth: 1,
    borderTopColor: 'rgba(233, 233, 237, 0.1)',
  },
  cellLabel: {
    fontFamily: font.regular,
    fontSize: 11,
    color: color.muted,
  },
  cellValue: {
    fontFamily: font.medium,
    fontSize: 14,
    color: color.text,
    marginTop: 3,
  },
})
