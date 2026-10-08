import { useState, type ReactNode } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { CaretLeftIcon, ImageIcon } from 'phosphor-react-native'
import type { TradeDirection } from '../../types/journal'
import { createTrade, uploadScreenshot } from '../../lib/api'
import { color, font, radius } from '../../theme/tokens'

interface LogTradeScreenProps {
  initialSymbol?: string
  onDone: () => void
  onCancel: () => void
}

export function LogTradeScreen({ initialSymbol, onDone, onCancel }: LogTradeScreenProps) {
  const [symbol, setSymbol] = useState(initialSymbol ?? '')
  const [direction, setDirection] = useState<TradeDirection>('BUY')
  const [entryPrice, setEntryPrice] = useState('')
  const [exitPrice, setExitPrice] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [resultR, setResultR] = useState('')
  const [followedPlan, setFollowedPlan] = useState(true)
  const [strategyTag, setStrategyTag] = useState('')
  const [notes, setNotes] = useState('')
  const [screenshot, setScreenshot] = useState<ImagePicker.ImagePickerAsset | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onPickScreenshot() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to attach a screenshot.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    })
    if (!result.canceled && result.assets[0]) {
      setScreenshot(result.assets[0])
    }
  }

  function validate(): string | null {
    if (!symbol.trim()) return 'Enter a symbol.'
    if (!entryPrice.trim() || Number.isNaN(Number(entryPrice))) return 'Enter a valid entry price.'
    if (!exitPrice.trim() || Number.isNaN(Number(exitPrice))) return 'Enter a valid exit price.'
    if (stopLoss.trim() && Number.isNaN(Number(stopLoss))) return 'Stop loss must be a number.'
    if (!resultR.trim() || Number.isNaN(Number(resultR))) return 'Enter the result in R (e.g. 2.1 or -1).'
    return null
  }

  async function onSubmit() {
    const error = validate()
    if (error) {
      Alert.alert('Check your entry', error)
      return
    }

    setSubmitting(true)
    try {
      const trade = await createTrade({
        symbol: symbol.trim().toUpperCase(),
        direction,
        entryPrice: Number(entryPrice),
        exitPrice: Number(exitPrice),
        stopLoss: stopLoss.trim() ? Number(stopLoss) : null,
        resultR: Number(resultR),
        followedPlan,
        strategyTag: strategyTag.trim() || null,
        notes: notes.trim() || null,
      })

      if (screenshot) {
        try {
          await uploadScreenshot(trade.id, screenshot.uri, { mimeType: screenshot.mimeType })
        } catch (uploadError) {
          console.error('screenshot upload failed', uploadError)
          Alert.alert('Trade saved', 'The screenshot failed to upload, but your trade was logged.')
        }
      }

      onDone()
    } catch {
      Alert.alert('Couldn’t save trade', 'Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={onCancel} hitSlop={10}>
            <CaretLeftIcon size={20} color={color.text2} />
          </Pressable>
          <Text style={styles.title}>Log a trade</Text>
        </View>

        <Field label="Symbol">
          <TextInput
            style={styles.input}
            value={symbol}
            onChangeText={(t) => setSymbol(t.toUpperCase())}
            placeholder="XAUUSD"
            placeholderTextColor={color.dim}
            autoCapitalize="characters"
          />
        </Field>

        <Field label="Direction">
          <View style={styles.directionRow}>
            {(['BUY', 'SELL'] as const).map((d) => (
              <Pressable
                key={d}
                style={[styles.directionButton, direction === d && styles.directionButtonActive]}
                onPress={() => setDirection(d)}
              >
                <Text style={[styles.directionText, direction === d && styles.directionTextActive]}>{d}</Text>
              </Pressable>
            ))}
          </View>
        </Field>

        <View style={styles.row}>
          <Field label="Entry price" style={styles.rowField}>
            <TextInput
              style={styles.input}
              value={entryPrice}
              onChangeText={setEntryPrice}
              placeholder="3344"
              placeholderTextColor={color.dim}
              keyboardType="decimal-pad"
            />
          </Field>
          <Field label="Exit price" style={styles.rowField}>
            <TextInput
              style={styles.input}
              value={exitPrice}
              onChangeText={setExitPrice}
              placeholder="3401"
              placeholderTextColor={color.dim}
              keyboardType="decimal-pad"
            />
          </Field>
        </View>

        <View style={styles.row}>
          <Field label="Stop loss (optional)" style={styles.rowField}>
            <TextInput
              style={styles.input}
              value={stopLoss}
              onChangeText={setStopLoss}
              placeholder="3331"
              placeholderTextColor={color.dim}
              keyboardType="decimal-pad"
            />
          </Field>
          <Field label="Result (R)" style={styles.rowField}>
            <TextInput
              style={styles.input}
              value={resultR}
              onChangeText={setResultR}
              placeholder="3.2"
              placeholderTextColor={color.dim}
              keyboardType="numbers-and-punctuation"
            />
          </Field>
        </View>

        <Field label="Strategy tag (optional)">
          <TextInput
            style={styles.input}
            value={strategyTag}
            onChangeText={setStrategyTag}
            placeholder="SMC-ITC · 4H POI"
            placeholderTextColor={color.dim}
          />
        </Field>

        <Field label="Notes (optional)">
          <TextInput
            style={[styles.input, styles.multiline]}
            value={notes}
            onChangeText={setNotes}
            placeholder="What happened?"
            placeholderTextColor={color.dim}
            multiline
          />
        </Field>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Followed my plan</Text>
          <Switch
            value={followedPlan}
            onValueChange={setFollowedPlan}
            trackColor={{ false: color.track, true: color.accent700 }}
            thumbColor={followedPlan ? color.accent400 : color.muted}
          />
        </View>

        <Pressable style={styles.screenshotButton} onPress={onPickScreenshot}>
          {screenshot ? (
            <Image source={{ uri: screenshot.uri }} style={styles.screenshotPreview} resizeMode="cover" />
          ) : (
            <>
              <ImageIcon size={18} color={color.text2} />
              <Text style={styles.screenshotButtonText}>Attach entry screenshot</Text>
            </>
          )}
        </Pressable>

        <Pressable style={styles.submitButton} onPress={onSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator size="small" color={color.canvas} />
          ) : (
            <Text style={styles.submitButtonText}>Save trade</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  )
}

function Field({ label, children, style }: { label: string; children: ReactNode; style?: object }) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.canvas,
  },
  content: {
    padding: 18,
    paddingTop: 24,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  title: {
    fontFamily: font.medium,
    fontSize: 20,
    color: color.text,
    letterSpacing: -0.3,
  },
  field: {
    marginBottom: 16,
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
    backgroundColor: color.raised,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowField: {
    flex: 1,
  },
  directionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  directionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.16)',
    backgroundColor: color.raised,
  },
  directionButtonActive: {
    borderColor: color.accent,
    backgroundColor: color.accent900,
  },
  directionText: {
    fontFamily: font.medium,
    fontSize: 13.5,
    color: color.text3,
  },
  directionTextActive: {
    color: color.accent300,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  switchLabel: {
    fontFamily: font.regular,
    fontSize: 14,
    color: color.text2,
  },
  screenshotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(233, 233, 237, 0.22)',
    borderRadius: radius.md,
    paddingVertical: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  screenshotButtonText: {
    fontFamily: font.regular,
    fontSize: 13.5,
    color: color.text2,
  },
  screenshotPreview: {
    width: '100%',
    height: 160,
  },
  submitButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: color.accent400,
  },
  submitButtonText: {
    fontFamily: font.semibold,
    fontSize: 15,
    color: color.canvas,
  },
})
