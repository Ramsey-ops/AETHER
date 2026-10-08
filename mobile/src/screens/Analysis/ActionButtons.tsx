import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { color, font, radius } from '../../theme/tokens'

interface ActionButtonsProps {
  onLogToJournal: () => void
}

/**
 * "Log to journal" opens Screen 5's form pre-filled with this pair. A
 * per-pair "Set alert" still needs a standalone alerts system — that one
 * stays an honest stub: present, on-brand, explicit that it lands with its
 * own module instead of silently doing nothing.
 */
export function ActionButtons({ onLogToJournal }: ActionButtonsProps) {
  return (
    <View style={styles.row}>
      <Pressable style={styles.button} onPress={onLogToJournal}>
        <Text style={styles.buttonText}>Log to journal</Text>
      </Pressable>
      <Pressable
        style={[styles.button, styles.buttonSecondary]}
        onPress={() => Alert.alert('Coming soon', 'Per-pair price alerts arrive in a later module.')}
      >
        <Text style={styles.buttonTextSecondary}>Set alert</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.accent,
  },
  buttonText: {
    fontFamily: font.regular,
    fontSize: 14,
    color: color.accent300,
  },
  buttonSecondary: {
    borderColor: 'rgba(233, 233, 237, 0.18)',
  },
  buttonTextSecondary: {
    fontFamily: font.regular,
    fontSize: 14,
    color: color.text2,
  },
})
