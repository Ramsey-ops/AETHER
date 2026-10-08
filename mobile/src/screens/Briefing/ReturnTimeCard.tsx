import { useEffect, useRef, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { BellSimpleIcon, CheckCircleIcon } from 'phosphor-react-native'
import type { ReturnRecommendation } from '../../types/briefing'
import { color, font, radius } from '../../theme/tokens'
import { formatUtcHHMMAsLocal, nextUtcOccurrence } from '../../lib/time'

interface ReturnTimeCardProps {
  recommendation: ReturnRecommendation
}

type AlertState = 'idle' | 'scheduled' | 'fired'

/**
 * FR-NOTIFY-001 (Part 2.10/2.13): reminds the trader when to come back.
 *
 * This is an in-app reminder (a JS timer that fires while Aether is open
 * or brought back to the foreground) rather than an OS push notification.
 * expo-notifications was tried first, but its native Android module
 * refuses to initialize under Expo Go at all — not just for remote push —
 * and Metro bundles the module eagerly even behind a dynamic import, so
 * there's no way to gate around it from JS alone. A development or
 * production build removes that restriction; this component can switch to
 * real OS notifications then without changing its interface.
 */
export function ReturnTimeCard({ recommendation }: ReturnTimeCardProps) {
  const [state, setState] = useState<AlertState>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  function onSetAlert() {
    const fireDate = nextUtcOccurrence(recommendation.returnAtUTC)
    const delayMs = fireDate.getTime() - Date.now()

    timerRef.current = setTimeout(() => {
      setState('fired')
      Alert.alert('Aether — time to check back in', recommendation.reason)
    }, delayMs)

    setState('scheduled')
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.textCol}>
          <Text style={styles.label}>RETURN AT</Text>
          <Text style={styles.time}>{formatUtcHHMMAsLocal(recommendation.returnAtUTC)}</Text>
          <Text style={styles.utcHint}>{recommendation.returnAtUTC} UTC</Text>
          <Text style={styles.reason}>{recommendation.reason}</Text>
        </View>
        <Pressable
          style={[styles.button, state !== 'idle' && styles.buttonDone]}
          onPress={onSetAlert}
          disabled={state !== 'idle'}
        >
          {state === 'idle' && <BellSimpleIcon size={15} color={color.accent300} />}
          {state !== 'idle' && <CheckCircleIcon size={15} color={color.up} weight="fill" />}
          <Text style={[styles.buttonText, state !== 'idle' && styles.buttonTextDone]}>
            {state === 'idle' ? 'Remind me' : 'Reminder set'}
          </Text>
        </Pressable>
      </View>
      {state !== 'idle' && (
        <Text style={styles.hint}>
          Reminds you in-app while Aether is open — background push alerts need a development
          build.
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.12)',
    borderRadius: radius.md,
    backgroundColor: color.raised,
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textCol: {
    flex: 1,
  },
  label: {
    fontFamily: font.regular,
    fontSize: 10.5,
    letterSpacing: 1.4,
    color: color.muted,
  },
  time: {
    fontFamily: font.semibold,
    fontSize: 18,
    color: color.text,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  utcHint: {
    fontFamily: font.regular,
    fontSize: 10.5,
    color: color.dim,
    marginTop: 1,
  },
  reason: {
    fontFamily: font.regular,
    fontSize: 12,
    color: color.text3,
    marginTop: 5,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: color.accent,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  buttonDone: {
    borderColor: 'rgba(143, 206, 159, 0.5)',
  },
  buttonText: {
    fontFamily: font.medium,
    fontSize: 13,
    color: color.accent300,
  },
  buttonTextDone: {
    color: color.up,
  },
  hint: {
    fontFamily: font.regular,
    fontSize: 11.5,
    color: color.dim,
    marginTop: 8,
  },
})
