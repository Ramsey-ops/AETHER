import { StyleSheet, Text, View } from 'react-native'
import { color, font, radius } from '../../theme/tokens'

const FIELDS: { label: string; width: `${number}%` }[] = [
  { label: 'AI reasoning', width: '88%' },
  { label: 'Entry zone', width: '54%' },
  { label: 'Dynamic R:R', width: '40%' },
  { label: 'Invalidation', width: '62%' },
  { label: 'Next review', width: '34%' },
  { label: 'Learning feedback', width: '70%' },
]

/**
 * Every field here is an integration placeholder — the Phase 3 model isn't
 * connected yet. No values are simulated; this renders the same honest
 * "AI OUTPUT" skeleton the approved design specifies for this state.
 */
export function AiOutputPlaceholders() {
  return (
    <View>
      <View style={styles.decisionCard}>
        <View style={styles.decisionHeaderRow}>
          <Text style={styles.decisionLabel}>AI DECISION</Text>
          <View style={styles.placeholderTag}>
            <Text style={styles.placeholderTagText}>Placeholder</Text>
          </View>
        </View>
        <View style={styles.decisionRow}>
          <View style={styles.decisionBox}>
            <Text style={styles.decisionBoxText}>BUY · SELL · WAIT · NO TRADE · MONITOR</Text>
          </View>
          <View style={styles.confidenceCol}>
            <Text style={styles.confidenceLabel}>Confidence</Text>
            <Text style={styles.confidenceValue}>––</Text>
          </View>
        </View>
        <Text style={styles.decisionFootnote}>
          The decision and every field below are populated by the AI engine once connected. No values are
          simulated here.
        </Text>
      </View>

      <Text style={styles.sectionLabel}>AI INTERPRETATION</Text>
      <View style={styles.fieldList}>
        {FIELDS.map((f) => (
          <View key={f.label} style={styles.fieldRow}>
            <View style={styles.fieldHeaderRow}>
              <Text style={styles.fieldLabel}>{f.label}</Text>
              <Text style={styles.fieldTag}>AI OUTPUT</Text>
            </View>
            <View style={styles.fieldBarTrack}>
              <View style={[styles.fieldBarFill, { width: f.width }]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  decisionCard: {
    borderWidth: 1,
    borderColor: 'rgba(145, 132, 217, 0.4)',
    borderRadius: radius.lg,
    backgroundColor: color.accent900,
    padding: 16,
    marginTop: 14,
  },
  decisionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  decisionLabel: {
    fontFamily: font.regular,
    fontSize: 11,
    letterSpacing: 1.4,
    color: color.accent400,
  },
  placeholderTag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.18)',
  },
  placeholderTagText: {
    fontFamily: font.regular,
    fontSize: 10,
    color: color.muted,
  },
  decisionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 12,
  },
  decisionBox: {
    flex: 1,
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(145, 132, 217, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  decisionBoxText: {
    fontFamily: font.regular,
    fontSize: 12,
    color: color.muted,
    textAlign: 'center',
  },
  confidenceCol: {
    alignItems: 'flex-end',
  },
  confidenceLabel: {
    fontFamily: font.regular,
    fontSize: 11,
    color: color.muted,
  },
  confidenceValue: {
    fontFamily: font.medium,
    fontSize: 20,
    color: color.dim,
    marginTop: 2,
  },
  decisionFootnote: {
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 17,
    color: color.text3,
    marginTop: 12,
  },
  sectionLabel: {
    fontFamily: font.regular,
    fontSize: 11,
    letterSpacing: 1.4,
    color: color.muted,
    marginTop: 22,
    marginBottom: 10,
  },
  fieldList: {
    gap: 8,
  },
  fieldRow: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(233, 233, 237, 0.16)',
    borderRadius: radius.md,
    backgroundColor: color.raised,
    padding: 12,
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontFamily: font.regular,
    fontSize: 11.5,
    color: color.muted,
  },
  fieldTag: {
    fontFamily: font.regular,
    fontSize: 9.5,
    letterSpacing: 0.6,
    color: color.dim,
  },
  fieldBarTrack: {
    height: 9,
    borderRadius: 99,
    backgroundColor: color.track,
    marginTop: 9,
    overflow: 'hidden',
  },
  fieldBarFill: {
    height: '100%',
    backgroundColor: 'rgba(233, 233, 237, 0.1)',
  },
})
