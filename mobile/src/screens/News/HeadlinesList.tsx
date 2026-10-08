import { useState } from 'react'
import { ArrowSquareOutIcon, ClockIcon, SparkleIcon, XIcon } from 'phosphor-react-native'
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { EventImpact, Headline, SentimentLabel, TradeImpact } from '../../types/news'
import { color, font, radius } from '../../theme/tokens'

interface HeadlinesListProps {
  headlines: Headline[]
}

const SENTIMENT_COLOR: Record<SentimentLabel, string> = {
  Bullish: color.up,
  Bearish: color.down,
  Neutral: color.text3,
}

const IMPACT_PILL: Record<EventImpact, { bg: string; border: string; text: string }> = {
  high: { bg: 'rgba(160, 80, 80, 0.18)', border: 'rgba(214, 138, 138, 0.4)', text: color.down },
  medium: { bg: 'rgba(181, 171, 252, 0.14)', border: 'rgba(181, 171, 252, 0.32)', text: color.accent300 },
  low: { bg: 'rgba(233, 233, 237, 0.08)', border: 'rgba(233, 233, 237, 0.16)', text: color.dim },
}

const TRADE_IMPACT_LABEL: Record<TradeImpact, string> = {
  in_favor: 'IN FAVOR OF TRADE',
  not_in_favor: 'NOT IN FAVOR',
  neutral: 'NEUTRAL',
  news_risk: 'NEWS RISK',
}

function ImpactPill({ impact }: { impact: EventImpact }) {
  const p = IMPACT_PILL[impact]
  return (
    <View style={[styles.impactPill, { backgroundColor: p.bg, borderColor: p.border }]}>
      <Text style={[styles.impactPillText, { color: p.text }]}>{impact.toUpperCase()} IMPACT</Text>
    </View>
  )
}

function InstitutionalTakeBox({ headline }: { headline: Headline }) {
  if (!headline.aiInterpreted || !headline.institutionalTake) return null
  return (
    <View style={styles.takeBox}>
      <View style={styles.takeHeaderRow}>
        <SparkleIcon size={12} color={color.accent400} weight="fill" />
        <Text style={styles.takeLabel}>AETHER INSTITUTIONAL TAKE</Text>
        {headline.tradeImpact === 'news_risk' && (
          <View style={styles.newsRiskPill}>
            <Text style={styles.newsRiskPillText}>{TRADE_IMPACT_LABEL.news_risk}</Text>
          </View>
        )}
      </View>
      <Text style={styles.takeText}>{headline.institutionalTake}</Text>
    </View>
  )
}

export function HeadlinesList({ headlines }: HeadlinesListProps) {
  const [selected, setSelected] = useState<Headline | null>(null)

  if (headlines.length === 0) return null

  return (
    <View>
      <Text style={styles.sectionLabel}>HEADLINES THE ENGINE READ</Text>
      <View style={styles.list}>
        {headlines.map((headline, i) => (
          <Pressable key={i} style={styles.card} onPress={() => setSelected(headline)}>
            <View style={styles.topRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{headline.currencyTag}</Text>
              </View>
              <ImpactPill impact={headline.impact} />
              <Text style={styles.source} numberOfLines={1}>
                {headline.source}
              </Text>
              <View style={styles.timeRow}>
                <ClockIcon size={11} color={color.dim} weight="regular" />
                <Text style={styles.timeAgo}>{headline.timeAgoLabel.toUpperCase()}</Text>
              </View>
            </View>

            <Text style={styles.text}>{headline.text}</Text>
            {headline.summary && (
              <Text style={styles.summary} numberOfLines={2}>
                {headline.summary}
              </Text>
            )}

            <View style={styles.metaRow}>
              {headline.affectedAssets.length > 0 && (
                <Text style={styles.affected} numberOfLines={1}>
                  {headline.affectedAssets.join(' · ')}
                </Text>
              )}
              <Text style={[styles.sentiment, { color: SENTIMENT_COLOR[headline.sentimentLabel] }]}>
                {headline.sentimentLabel} {headline.sentimentScore.toFixed(2)}
              </Text>
            </View>

            <InstitutionalTakeBox headline={headline} />
          </Pressable>
        ))}
      </View>

      <Modal visible={selected != null} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            {selected && (
              <>
                <View style={styles.modalHeaderRow}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{selected.currencyTag}</Text>
                  </View>
                  <ImpactPill impact={selected.impact} />
                  <Pressable onPress={() => setSelected(null)} hitSlop={10} style={styles.modalCloseButton}>
                    <XIcon size={18} color={color.text2} />
                  </Pressable>
                </View>

                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalSource}>
                    {selected.source} · {selected.timeAgoLabel}
                  </Text>
                  <Text style={styles.modalTitle}>{selected.text}</Text>

                  {selected.summary && <Text style={styles.modalSummary}>{selected.summary}</Text>}

                  <View style={styles.modalMetaRow}>
                    {selected.affectedAssets.length > 0 && (
                      <Text style={styles.affected}>{selected.affectedAssets.join(' · ')}</Text>
                    )}
                    <Text style={[styles.sentiment, { color: SENTIMENT_COLOR[selected.sentimentLabel] }]}>
                      {selected.sentimentLabel} {selected.sentimentScore.toFixed(2)}
                    </Text>
                  </View>

                  <InstitutionalTakeBox headline={selected} />
                  {selected.aiInterpreted && !selected.institutionalTake && selected.rootCause && (
                    <Text style={styles.modalSummary}>Why: {selected.rootCause}</Text>
                  )}

                  {selected.url && (
                    <Pressable style={styles.readFullButton} onPress={() => Linking.openURL(selected.url!)}>
                      <Text style={styles.readFullButtonText}>Read full article</Text>
                      <ArrowSquareOutIcon size={14} color={color.accent300} />
                    </Pressable>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontFamily: font.regular,
    fontSize: 11,
    letterSpacing: 1.4,
    color: color.muted,
    marginTop: 22,
    marginBottom: 10,
  },
  list: {
    gap: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.12)',
    borderRadius: radius.md,
    backgroundColor: color.raised,
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.18)',
  },
  tagText: {
    fontFamily: font.regular,
    fontSize: 11,
    color: color.text3,
  },
  impactPill: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 99,
    borderWidth: 1,
  },
  impactPillText: {
    fontFamily: font.regular,
    fontSize: 9,
    letterSpacing: 0.4,
  },
  source: {
    marginLeft: 'auto',
    fontFamily: font.regular,
    fontSize: 11,
    color: color.dim,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeAgo: {
    fontFamily: font.regular,
    fontSize: 10,
    letterSpacing: 0.3,
    color: color.dim,
  },
  text: {
    fontFamily: font.regular,
    fontSize: 13.5,
    lineHeight: 20,
    color: color.text,
    marginTop: 8,
  },
  summary: {
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 17,
    color: color.muted,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  affected: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 11,
    color: color.dim,
  },
  sentiment: {
    fontFamily: font.regular,
    fontSize: 11.5,
  },
  takeBox: {
    marginTop: 10,
    padding: 11,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(181, 171, 252, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(181, 171, 252, 0.28)',
    gap: 5,
  },
  takeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  takeLabel: {
    fontFamily: font.medium,
    fontSize: 9.5,
    letterSpacing: 0.8,
    color: color.accent400,
  },
  newsRiskPill: {
    marginLeft: 'auto',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 99,
    backgroundColor: 'rgba(160, 80, 80, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(214, 138, 138, 0.4)',
  },
  newsRiskPillText: {
    fontFamily: font.regular,
    fontSize: 9,
    letterSpacing: 0.3,
    color: color.down,
  },
  takeText: {
    fontFamily: font.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: color.text2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: color.raised,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.14)',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: '82%',
  },
  modalHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(233, 233, 237, 0.2)',
    marginBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalCloseButton: {
    marginLeft: 'auto',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(233, 233, 237, 0.08)',
  },
  modalScroll: {
    marginTop: 14,
  },
  modalSource: {
    fontFamily: font.regular,
    fontSize: 11.5,
    color: color.dim,
  },
  modalTitle: {
    fontFamily: font.medium,
    fontSize: 18,
    lineHeight: 25,
    color: color.text,
    marginTop: 6,
  },
  modalSummary: {
    fontFamily: font.regular,
    fontSize: 14,
    lineHeight: 21,
    color: color.text2,
    marginTop: 12,
  },
  modalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  readFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 16,
    marginBottom: 4,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.accent,
  },
  readFullButtonText: {
    fontFamily: font.regular,
    fontSize: 13.5,
    color: color.accent300,
  },
})
