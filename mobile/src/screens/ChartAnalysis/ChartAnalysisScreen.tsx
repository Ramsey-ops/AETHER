import { useState } from 'react'
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import {
  ArrowCircleUpIcon,
  ArrowSquareOutIcon,
  CaretLeftIcon,
  ImageSquareIcon,
  PaperclipIcon,
  SparkleIcon,
  WarningIcon,
} from 'phosphor-react-native'
import type { ChartAnalysis } from '../../types/chartAnalysis'
import { confirmChartDetection, uploadChartScreenshot } from '../../lib/api'
import { color, font, radius } from '../../theme/tokens'
import { DetectionCard } from './DetectionCard'
import { PairTimeframePicker } from './PairTimeframePicker'
import { LiveContextGrid } from './LiveContextGrid'
import { AiOutputPlaceholders } from './AiOutputPlaceholders'

interface ChartAnalysisScreenProps {
  onBack: () => void
  onSaveToJournal: (symbol: string) => void
  onComparePrimary: (symbol: string) => void
}

type ScreenState =
  | { phase: 'empty' }
  | { phase: 'uploading' }
  | { phase: 'confirming'; analysis: ChartAnalysis }
  | { phase: 'fetchingContext'; analysis: ChartAnalysis }
  | { phase: 'complete'; analysis: ChartAnalysis }
  | { phase: 'error'; message: string }

const HOW_IT_WORKS = [
  { step: '01', title: 'Upload your chart', body: 'One screenshot is enough.' },
  { step: '02', title: 'Confirm what it shows', body: 'Pair and timeframe — Aether can’t read the image yet.' },
  { step: '03', title: 'Live context is cross-checked', body: 'Price, calendar, news and sentiment for that pair.' },
  { step: '04', title: 'You get an analysis', body: 'Including WAIT and NO TRADE, when those are the honest answers.' },
]

const ASK_ABOUT_CHIPS = ["Today's verdict", 'My watchlist', 'Upcoming news', 'My journal', 'Goal progress']

function notYetAvailable() {
  Alert.alert('Not yet available', 'The conversational AI Assistant arrives in a later module.')
}

export function ChartAnalysisScreen({ onBack, onSaveToJournal, onComparePrimary }: ChartAnalysisScreenProps) {
  const [state, setState] = useState<ScreenState>({ phase: 'empty' })
  const [confirming, setConfirming] = useState(false)

  async function pickAndUpload(source: 'library' | 'camera') {
    const permission =
      source === 'library'
        ? await ImagePicker.requestMediaLibraryPermissionsAsync()
        : await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission needed', source === 'library' ? 'Allow photo library access to upload a chart.' : 'Allow camera access to capture a chart.')
      return
    }

    const result =
      source === 'library'
        ? await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 })
        : await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
    if (result.canceled || !result.assets[0]) return

    const asset = result.assets[0]
    setState({ phase: 'uploading' })
    try {
      const analysis = await uploadChartScreenshot(asset.uri, { mimeType: asset.mimeType })
      setState({ phase: 'confirming', analysis })
    } catch {
      setState({ phase: 'error', message: "Couldn't upload the screenshot. Check your connection and try again." })
    }
  }

  async function onConfirmDetection(pair: string, timeframe: string) {
    if (state.phase !== 'confirming') return
    setConfirming(true)
    setState({ phase: 'fetchingContext', analysis: state.analysis })
    try {
      const analysis = await confirmChartDetection(state.analysis.id, pair, timeframe)
      setState({ phase: 'complete', analysis })
    } catch {
      setState({ phase: 'error', message: "Couldn't reach Aether to cross-check live data. Try again." })
    } finally {
      setConfirming(false)
    }
  }

  const analysis = state.phase === 'confirming' || state.phase === 'fetchingContext' || state.phase === 'complete' ? state.analysis : null
  const showNewsRisk =
    state.phase === 'complete' && state.analysis.liveContext?.nextEventImpact === 'high' && state.analysis.liveContext.nextEventTitle

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable onPress={onBack} hitSlop={10}>
            <CaretLeftIcon size={20} color={color.text2} />
          </Pressable>
          <View style={styles.headerTextCol}>
            <View style={styles.headerTitleRow}>
              <SparkleIcon size={15} color={color.accent400} weight="fill" />
              <Text style={styles.headerTitle}>AI Assistant</Text>
            </View>
            <Text style={styles.headerSubtitle}>Chart analysis · screen 07</Text>
          </View>
        </View>

        {state.phase === 'empty' && (
          <>
            <Text style={styles.heroTitle}>Drop a chart.{'\n'}Get an AI trading analysis.</Text>
            <Text style={styles.heroBody}>
              Aether reads your screenshot, cross-checks live market context, then applies your connected
              strategy. It works alongside the primary analysis — a second opinion, not a second app.
            </Text>

            <View style={styles.strategyPill}>
              <View style={styles.strategyDot} />
              <Text style={styles.strategyText}>
                Active strategy · <Text style={styles.strategyValue}>Not yet connected</Text>
              </Text>
              <Text style={styles.strategyHint}>Applied at analysis</Text>
            </View>

            <View style={styles.uploadArea}>
              <View style={styles.uploadIcon}>
                <ImageSquareIcon size={24} color={color.accent300} />
              </View>
              <Text style={styles.uploadPrompt}>Upload a chart screenshot</Text>
              <View style={styles.uploadActions}>
                <Pressable style={styles.uploadButton} onPress={() => pickAndUpload('library')}>
                  <Text style={styles.uploadButtonText}>Upload chart</Text>
                </Pressable>
                <Pressable style={styles.browseButton} onPress={() => pickAndUpload('camera')}>
                  <Text style={styles.browseButtonText}>Take photo</Text>
                </Pressable>
              </View>
              <Pressable
                style={styles.tradingViewLink}
                onPress={() => Linking.openURL('https://www.tradingview.com/chart/')}
              >
                <ArrowSquareOutIcon size={14} color={color.accent400} />
                <Text style={styles.tradingViewLinkText}>Go to TradingView</Text>
              </Pressable>
              <Text style={styles.uploadHint}>PNG or JPG · any pair, any timeframe</Text>
            </View>

            <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
            <View style={styles.stepList}>
              {HOW_IT_WORKS.map((s) => (
                <View key={s.step} style={styles.stepRow}>
                  <Text style={styles.stepNumber}>{s.step}</Text>
                  <View style={styles.stepTextCol}>
                    <Text style={styles.stepTitle}>{s.title}</Text>
                    <Text style={styles.stepBody}>{s.body}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Text style={styles.sectionLabel}>OR ASK ABOUT</Text>
            <View style={styles.chipRow}>
              {ASK_ABOUT_CHIPS.map((c) => (
                <Pressable key={c} style={styles.askChip} onPress={notYetAvailable}>
                  <Text style={styles.askChipText}>{c}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.composer} onPress={notYetAvailable}>
              <PaperclipIcon size={17} color={color.muted} />
              <Text style={styles.composerText}>Ask Aether anything…</Text>
              <ArrowCircleUpIcon size={22} color={color.accent500} weight="fill" />
            </Pressable>
          </>
        )}

        {state.phase === 'uploading' && (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={color.accent400} />
            <Text style={styles.centerStateText}>Uploading screenshot…</Text>
          </View>
        )}

        {analysis && (state.phase === 'confirming' || state.phase === 'fetchingContext' || state.phase === 'complete') && (
          <>
            <DetectionCard
              screenshotUrl={analysis.screenshotUrl}
              detection={analysis.detection}
              statusLabel={state.phase === 'complete' ? 'Analyzed' : 'Uploaded'}
            />

            {state.phase === 'confirming' && (
              <PairTimeframePicker submitting={confirming} onConfirm={onConfirmDetection} />
            )}

            {state.phase === 'fetchingContext' && (
              <View style={styles.centerState}>
                <ActivityIndicator size="small" color={color.accent400} />
                <Text style={styles.centerStateText}>Cross-checking live market data…</Text>
              </View>
            )}

            {state.phase === 'complete' && (
              <>
                {analysis.liveContext && (
                  <LiveContextGrid pair={analysis.detection.pair ?? ''} context={analysis.liveContext} />
                )}

                {showNewsRisk && (
                  <View style={styles.newsRiskCard}>
                    <View style={styles.newsRiskHeaderRow}>
                      <WarningIcon size={14} color={color.down} />
                      <Text style={styles.newsRiskLabel}>NEWS RISK</Text>
                    </View>
                    <Text style={styles.newsRiskTitle}>{analysis.liveContext!.nextEventTitle}</Text>
                    <Text style={styles.newsRiskBody}>
                      Reactions to this release are uncertain — treat it as a risk to the setup, not a predicted
                      direction.
                    </Text>
                  </View>
                )}

                <AiOutputPlaceholders />

                <View style={styles.fusionNote}>
                  <Text style={styles.fusionNoteText}>
                    Screenshot analysis is a confirmation channel — compare it with today's primary analysis
                    before acting.
                  </Text>
                </View>

                <View style={styles.actionRow}>
                  <Pressable
                    style={styles.actionButtonAccent}
                    onPress={() => analysis.detection.pair && onSaveToJournal(analysis.detection.pair)}
                  >
                    <Text style={styles.actionButtonAccentText}>Save to journal</Text>
                  </Pressable>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => analysis.detection.pair && onComparePrimary(analysis.detection.pair)}
                  >
                    <Text style={styles.actionButtonText}>Compare with primary</Text>
                  </Pressable>
                </View>
              </>
            )}
          </>
        )}

        {state.phase === 'error' && (
          <View style={styles.centerState}>
            <WarningIcon size={28} color={color.caution} />
            <Text style={styles.centerStateText}>{state.message}</Text>
            <Pressable style={styles.retryButton} onPress={() => setState({ phase: 'empty' })}>
              <Text style={styles.retryButtonText}>Start over</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
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
    gap: 12,
    marginBottom: 16,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  headerTitle: {
    fontFamily: font.semibold,
    fontSize: 17,
    color: color.text,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontFamily: font.regular,
    fontSize: 12,
    color: color.muted,
    marginTop: 3,
  },
  heroTitle: {
    fontFamily: font.medium,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
    color: color.text,
  },
  heroBody: {
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 19,
    color: color.text3,
    marginTop: 9,
    marginBottom: 16,
  },
  strategyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.16)',
    borderRadius: radius.md,
    backgroundColor: color.raised,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  strategyDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: color.caution,
  },
  strategyText: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 12.5,
    color: color.text2,
  },
  strategyValue: {
    color: color.text,
  },
  strategyHint: {
    fontFamily: font.regular,
    fontSize: 11,
    color: color.muted,
  },
  uploadArea: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(145, 132, 217, 0.55)',
    borderRadius: radius.lg,
    backgroundColor: 'rgba(66, 58, 106, 0.18)',
    paddingVertical: 26,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 12,
  },
  uploadIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(145, 132, 217, 0.45)',
    backgroundColor: color.accent900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPrompt: {
    fontFamily: font.regular,
    fontSize: 15,
    color: color.text,
    textAlign: 'center',
  },
  uploadActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  uploadButton: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: color.accent500,
  },
  uploadButtonText: {
    fontFamily: font.medium,
    fontSize: 13,
    color: '#fff',
  },
  browseButton: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.18)',
  },
  browseButtonText: {
    fontFamily: font.medium,
    fontSize: 13,
    color: color.text2,
  },
  tradingViewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tradingViewLinkText: {
    fontFamily: font.regular,
    fontSize: 12,
    color: color.accent400,
  },
  uploadHint: {
    fontFamily: font.regular,
    fontSize: 11.5,
    color: color.dim,
    textAlign: 'center',
  },
  sectionLabel: {
    fontFamily: font.regular,
    fontSize: 11,
    letterSpacing: 1.4,
    color: color.muted,
    marginTop: 22,
    marginBottom: 10,
  },
  stepList: {
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.12)',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 13,
    backgroundColor: color.raised,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(233, 233, 237, 0.08)',
  },
  stepNumber: {
    width: 24,
    fontFamily: font.regular,
    fontSize: 11.5,
    color: color.accent400,
  },
  stepTextCol: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: font.regular,
    fontSize: 13.5,
    color: color.text,
  },
  stepBody: {
    fontFamily: font.regular,
    fontSize: 12,
    color: color.muted,
    marginTop: 3,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  askChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.16)',
  },
  askChipText: {
    fontFamily: font.regular,
    fontSize: 12,
    color: color.text2,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.16)',
    borderRadius: 99,
    backgroundColor: color.raised,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 22,
  },
  composerText: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 13.5,
    color: color.dim,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 60,
  },
  centerStateText: {
    fontFamily: font.regular,
    fontSize: 13.5,
    color: color.text2,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.accent,
    marginTop: 6,
  },
  retryButtonText: {
    fontFamily: font.medium,
    fontSize: 13.5,
    color: color.accent300,
  },
  newsRiskCard: {
    borderWidth: 1,
    borderColor: 'rgba(214, 138, 138, 0.4)',
    borderRadius: radius.md,
    backgroundColor: 'rgba(74, 42, 42, 0.28)',
    padding: 14,
    marginTop: 16,
  },
  newsRiskHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  newsRiskLabel: {
    fontFamily: font.regular,
    fontSize: 11,
    letterSpacing: 1.2,
    color: color.down,
  },
  newsRiskTitle: {
    fontFamily: font.medium,
    fontSize: 14,
    color: color.text,
    marginTop: 7,
  },
  newsRiskBody: {
    fontFamily: font.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: color.cautionText,
    marginTop: 4,
  },
  fusionNote: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.14)',
    borderRadius: radius.md,
    backgroundColor: color.raised,
    padding: 13,
    marginTop: 14,
  },
  fusionNoteText: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: color.text2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 16,
  },
  actionButtonAccent: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.accent,
  },
  actionButtonAccentText: {
    fontFamily: font.medium,
    fontSize: 13.5,
    color: color.accent300,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.18)',
  },
  actionButtonText: {
    fontFamily: font.medium,
    fontSize: 13.5,
    color: color.text2,
  },
})
