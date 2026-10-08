import { useState } from 'react'
import { ActivityIndicator, Alert, Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { PencilSimpleIcon, TrashIcon, XIcon } from 'phosphor-react-native'
import type { TradeLogEntry } from '../../types/journal'
import { addLesson, deleteTrade, resolveMediaUrl, sendForRetraining } from '../../lib/api'
import { color, font, radius } from '../../theme/tokens'
import { formatFxPrice } from '../../lib/format'

interface TradeCardProps {
  trade: TradeLogEntry
  onMutated: () => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
}

export function TradeCard({ trade, onMutated }: TradeCardProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [lessonModalOpen, setLessonModalOpen] = useState(false)
  const [lessonDraft, setLessonDraft] = useState(trade.lesson ?? '')
  const [savingLesson, setSavingLesson] = useState(false)
  const [sendingForRetraining, setSendingForRetraining] = useState(false)

  const win = trade.resultR >= 0

  async function onSaveLesson() {
    if (!lessonDraft.trim()) return
    setSavingLesson(true)
    try {
      await addLesson(trade.id, lessonDraft.trim())
      setLessonModalOpen(false)
      onMutated()
    } catch {
      Alert.alert('Couldn’t save lesson', 'Check your connection and try again.')
    } finally {
      setSavingLesson(false)
    }
  }

  async function onSendForRetraining() {
    setSendingForRetraining(true)
    try {
      await sendForRetraining(trade.id)
      onMutated()
    } catch {
      Alert.alert('Couldn’t send', 'Check your connection and try again.')
    } finally {
      setSendingForRetraining(false)
    }
  }

  function onDelete() {
    Alert.alert('Delete trade?', 'This removes the entry and its screenshot permanently.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteTrade(trade.id).then(onMutated),
      },
    ])
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.symbol}>{trade.symbol}</Text>
        <View style={[styles.resultPill, win ? styles.resultPillUp : styles.resultPillDown]}>
          <Text style={[styles.resultText, { color: win ? color.up : color.down }]}>
            {win ? '+' : ''}
            {trade.resultR.toFixed(1)}R
          </Text>
        </View>
        <Text style={styles.date}>{formatDate(trade.closedAtUTC)}</Text>
        <Pressable onPress={onDelete} hitSlop={8}>
          <TrashIcon size={15} color={color.dim} />
        </Pressable>
      </View>

      <Text style={styles.description}>
        {trade.direction} {formatFxPrice(trade.symbol, trade.entryPrice)} → {formatFxPrice(trade.symbol, trade.exitPrice)}
        {trade.stopLoss != null && ` · SL ${formatFxPrice(trade.symbol, trade.stopLoss)}`}
      </Text>
      {trade.notes && <Text style={styles.notes}>{trade.notes}</Text>}

      {(trade.strategyTag || trade.followedPlan) && (
        <View style={styles.tagRow}>
          {trade.strategyTag && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{trade.strategyTag}</Text>
            </View>
          )}
          {trade.followedPlan && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>Followed plan</Text>
            </View>
          )}
        </View>
      )}

      {trade.screenshotUrl && (
        <Pressable onPress={() => setViewerOpen(true)}>
          <Image source={{ uri: resolveMediaUrl(trade.screenshotUrl) }} style={styles.screenshot} resizeMode="cover" />
        </Pressable>
      )}

      {/* aiComment is always null until Phase 3 exists — rendering it here
          costs nothing today and needs no changes once it's real. */}
      {trade.aiComment && (
        <View style={styles.aiComment}>
          <Text style={styles.aiCommentLabel}>AI COMMENT</Text>
          <Text style={styles.aiCommentText}>{trade.aiComment}</Text>
        </View>
      )}

      {trade.lesson ? (
        <View style={styles.lessonBox}>
          <Text style={styles.lessonLabel}>LESSON</Text>
          <Text style={styles.lessonText}>{trade.lesson}</Text>
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <Pressable style={styles.actionButton} onPress={() => setLessonModalOpen(true)}>
          <PencilSimpleIcon size={13} color={color.text2} />
          <Text style={styles.actionButtonText}>{trade.lesson ? 'Edit lesson' : 'Add lesson'}</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.actionButtonAccent, trade.sentForRetraining && styles.actionButtonDone]}
          onPress={onSendForRetraining}
          disabled={trade.sentForRetraining || sendingForRetraining}
        >
          {sendingForRetraining ? (
            <ActivityIndicator size="small" color={color.accent300} />
          ) : (
            <Text style={[styles.actionButtonText, styles.actionButtonTextAccent]}>
              {trade.sentForRetraining ? 'Sent for retraining' : 'Send for retraining'}
            </Text>
          )}
        </Pressable>
      </View>

      <Modal visible={lessonModalOpen} transparent animationType="fade" onRequestClose={() => setLessonModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Lesson — {trade.symbol}</Text>
            <TextInput
              style={styles.modalInput}
              value={lessonDraft}
              onChangeText={setLessonDraft}
              placeholder="What would you do differently?"
              placeholderTextColor={color.dim}
              multiline
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalButton} onPress={() => setLessonModalOpen(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonAccent]}
                onPress={onSaveLesson}
                disabled={savingLesson || !lessonDraft.trim()}
              >
                {savingLesson ? (
                  <ActivityIndicator size="small" color={color.accent300} />
                ) : (
                  <Text style={[styles.modalButtonText, styles.modalButtonTextAccent]}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {trade.screenshotUrl && (
        <Modal visible={viewerOpen} transparent animationType="fade" onRequestClose={() => setViewerOpen(false)}>
          <Pressable style={styles.viewerBackdrop} onPress={() => setViewerOpen(false)}>
            <Image
              source={{ uri: resolveMediaUrl(trade.screenshotUrl) }}
              style={styles.viewerImage}
              resizeMode="contain"
            />
            <Pressable style={styles.viewerCloseButton} onPress={() => setViewerOpen(false)} hitSlop={12}>
              <XIcon size={20} color={color.text} />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.12)',
    borderRadius: radius.md,
    backgroundColor: color.raised,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  symbol: {
    fontFamily: font.semibold,
    fontSize: 15,
    color: color.text,
  },
  resultPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 99,
    borderWidth: 1,
  },
  resultPillUp: {
    backgroundColor: 'rgba(107, 168, 124, 0.18)',
    borderColor: 'rgba(143, 206, 159, 0.35)',
  },
  resultPillDown: {
    backgroundColor: 'rgba(160, 80, 80, 0.16)',
    borderColor: 'rgba(214, 138, 138, 0.35)',
  },
  resultText: {
    fontFamily: font.regular,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  date: {
    marginLeft: 'auto',
    fontFamily: font.regular,
    fontSize: 11.5,
    color: color.dim,
  },
  description: {
    fontFamily: font.regular,
    fontSize: 12.5,
    color: color.text3,
    marginTop: 7,
    lineHeight: 18,
  },
  notes: {
    fontFamily: font.regular,
    fontSize: 12.5,
    color: color.text3,
    marginTop: 4,
    lineHeight: 18,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 9,
  },
  tag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.16)',
  },
  tagText: {
    fontFamily: font.regular,
    fontSize: 11,
    color: color.text3,
  },
  screenshot: {
    width: '100%',
    height: 140,
    borderRadius: radius.sm,
    marginTop: 11,
    backgroundColor: color.sunken,
  },
  aiComment: {
    borderLeftWidth: 2,
    borderLeftColor: color.accent700,
    paddingLeft: 11,
    paddingVertical: 8,
    marginTop: 11,
  },
  aiCommentLabel: {
    fontFamily: font.regular,
    fontSize: 11,
    letterSpacing: 1.2,
    color: color.accent500,
  },
  aiCommentText: {
    fontFamily: font.regular,
    fontSize: 12.5,
    color: color.text2,
    lineHeight: 19,
    marginTop: 5,
  },
  lessonBox: {
    borderLeftWidth: 2,
    borderLeftColor: color.accent700,
    paddingLeft: 11,
    paddingVertical: 8,
    marginTop: 11,
  },
  lessonLabel: {
    fontFamily: font.regular,
    fontSize: 11,
    letterSpacing: 1.2,
    color: color.accent500,
  },
  lessonText: {
    fontFamily: font.regular,
    fontSize: 12.5,
    color: color.text2,
    lineHeight: 19,
    marginTop: 5,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.18)',
  },
  actionButtonAccent: {
    borderColor: color.accent,
  },
  actionButtonDone: {
    borderColor: 'rgba(233, 233, 237, 0.14)',
  },
  actionButtonText: {
    fontFamily: font.regular,
    fontSize: 12.5,
    color: color.text2,
  },
  actionButtonTextAccent: {
    color: color.accent300,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: color.raised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.14)',
    padding: 18,
  },
  modalTitle: {
    fontFamily: font.medium,
    fontSize: 16,
    color: color.text,
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.16)',
    borderRadius: radius.md,
    padding: 12,
    minHeight: 90,
    fontFamily: font.regular,
    fontSize: 13.5,
    color: color.text,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  modalButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.18)',
  },
  modalButtonAccent: {
    borderColor: color.accent,
  },
  modalButtonText: {
    fontFamily: font.regular,
    fontSize: 13.5,
    color: color.text2,
  },
  modalButtonTextAccent: {
    color: color.accent300,
  },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '80%',
  },
  viewerCloseButton: {
    position: 'absolute',
    top: 54,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
