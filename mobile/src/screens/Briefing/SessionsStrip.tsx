import { StyleSheet, Text, View } from 'react-native'
import type { SessionInfo } from '../../types/briefing'
import { color, font, radius } from '../../theme/tokens'
import { formatUtcHHMMAsLocal } from '../../lib/time'

interface SessionsStripProps {
  sessions: SessionInfo[]
}

export function SessionsStrip({ sessions }: SessionsStripProps) {
  const nextHint = sessions.find((s) => s.opensInLabel)

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.label}>SESSIONS</Text>
        {nextHint && (
          <Text style={styles.hint}>
            {nextHint.name} opens in {nextHint.opensInLabel}
          </Text>
        )}
      </View>
      <View style={styles.grid}>
        {sessions.map((session) => {
          const isNext = session === nextHint
          return (
            <View key={session.name} style={[styles.cell, isNext && styles.cellNext]}>
              <Text style={[styles.name, isNext && styles.nameNext]}>{session.name}</Text>
              <Text style={styles.time}>
                {session.isOpen ? 'Open' : formatUtcHHMMAsLocal(session.opensAtUTC)}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 20,
    marginBottom: 10,
  },
  label: {
    fontFamily: font.regular,
    fontSize: 11,
    letterSpacing: 1.7,
    color: color.muted,
  },
  hint: {
    fontFamily: font.regular,
    fontSize: 12,
    color: color.accent400,
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
  cell: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.12)',
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 11,
    backgroundColor: color.raised,
  },
  cellNext: {
    borderColor: 'rgba(145, 132, 217, 0.45)',
    backgroundColor: color.surface,
  },
  name: {
    fontFamily: font.regular,
    fontSize: 12,
    color: color.muted,
  },
  nameNext: {
    color: color.accent400,
  },
  time: {
    fontFamily: font.regular,
    fontSize: 13,
    color: color.text,
    marginTop: 3,
  },
})
