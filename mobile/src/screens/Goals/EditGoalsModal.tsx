import { useState } from 'react'
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import type { GoalSettings } from '../../types/goals'
import { updateGoalSettings } from '../../lib/api'
import { color, font, radius } from '../../theme/tokens'

interface EditGoalsModalProps {
  visible: boolean
  settings: GoalSettings
  onClose: () => void
  onSaved: () => void
}

function toInput(n: number): string {
  return n === 0 ? '' : String(n)
}

export function EditGoalsModal({ visible, settings, onClose, onSaved }: EditGoalsModalProps) {
  const [startingBalance, setStartingBalance] = useState(toInput(settings.startingBalance))
  const [currentBalance, setCurrentBalance] = useState(toInput(settings.currentBalance))
  const [monthlyTarget, setMonthlyTarget] = useState(toInput(settings.monthlyTargetCurrency))
  const [weeklyTarget, setWeeklyTarget] = useState(toInput(settings.weeklyTargetCurrency))
  const [weeklyAchieved, setWeeklyAchieved] = useState(toInput(settings.weeklyAchievedCurrency))
  const [saving, setSaving] = useState(false)

  function parsed(value: string): number {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  }

  async function onSave() {
    setSaving(true)
    try {
      await updateGoalSettings({
        startingBalance: parsed(startingBalance),
        currentBalance: parsed(currentBalance),
        monthlyTargetCurrency: parsed(monthlyTarget),
        weeklyTargetCurrency: parsed(weeklyTarget),
        weeklyAchievedCurrency: parsed(weeklyAchieved),
      })
      onSaved()
    } catch {
      Alert.alert('Couldn’t save', 'Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Edit goals</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Field label="Starting balance ($)" value={startingBalance} onChangeText={setStartingBalance} />
            <Field label="Current balance ($)" value={currentBalance} onChangeText={setCurrentBalance} />
            <Field label="Monthly profit target ($)" value={monthlyTarget} onChangeText={setMonthlyTarget} />
            <Field label="Weekly profit target ($)" value={weeklyTarget} onChangeText={setWeeklyTarget} />
            <Field label="This week's result so far ($)" value={weeklyAchieved} onChangeText={setWeeklyAchieved} />
          </ScrollView>
          <View style={styles.actions}>
            <Pressable style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.buttonAccent]} onPress={onSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={color.accent300} />
              ) : (
                <Text style={[styles.buttonText, styles.buttonTextAccent]}>Save</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

function Field({
  label,
  value,
  onChangeText,
}: {
  label: string
  value: string
  onChangeText: (t: string) => void
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="0"
        placeholderTextColor={color.dim}
        keyboardType="numbers-and-punctuation"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: color.raised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.14)',
    padding: 18,
    maxHeight: '80%',
  },
  title: {
    fontFamily: font.medium,
    fontSize: 16,
    color: color.text,
    marginBottom: 14,
  },
  field: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontFamily: font.regular,
    fontSize: 11.5,
    color: color.muted,
    marginBottom: 7,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.16)',
    borderRadius: radius.md,
    paddingVertical: 11,
    paddingHorizontal: 13,
    fontFamily: font.regular,
    fontSize: 14,
    color: color.text,
    backgroundColor: color.sunken,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.18)',
  },
  buttonAccent: {
    borderColor: color.accent,
  },
  buttonText: {
    fontFamily: font.regular,
    fontSize: 13.5,
    color: color.text2,
  },
  buttonTextAccent: {
    color: color.accent300,
  },
})
