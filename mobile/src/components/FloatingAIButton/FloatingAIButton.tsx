import { useEffect, useRef } from 'react'
import { Animated, Easing, Pressable, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { CircleNotchIcon, SparkleIcon } from 'phosphor-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { color } from '../../theme/tokens'

interface FloatingAIButtonProps {
  onPress: () => void
  /** True for the brief moment between tap and the screen finishing its
   * opening transition — a spinning icon rather than an inert delay. */
  opening?: boolean
}

/**
 * The gateway to Screen 7 (Part 3B). Fixed bottom-right, above content and
 * clear of the tab bar + safe area, per the approved Claude Design spec
 * (Addition · Floating AI button). Present on screens 01-06; App.tsx hides
 * it on screen 07 itself, since that's where it leads.
 */
export function FloatingAIButton({ onPress, opening = false }: FloatingAIButtonProps) {
  const insets = useSafeAreaInsets()
  const scale = useRef(new Animated.Value(1)).current
  const spin = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!opening) return
    spin.setValue(0)
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 650, easing: Easing.linear, useNativeDriver: true }),
    )
    loop.start()
    return () => loop.stop()
  }, [opening, spin])

  function onPressIn() {
    Animated.timing(scale, { toValue: 0.94, duration: 90, useNativeDriver: true }).start()
  }
  function onPressOut() {
    Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }).start()
  }

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: insets.bottom + 86, transform: [{ scale }] }]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel="Open AI Assistant"
        style={styles.pressable}
      >
        <LinearGradient
          colors={[color.accent400, color.accent700]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={styles.button}
        >
          {opening ? (
            <Animated.View style={{ transform: [{ rotate }] }}>
              <CircleNotchIcon size={25} color="#fff" weight="bold" />
            </Animated.View>
          ) : (
            <SparkleIcon size={25} color="#fff" weight="fill" />
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 20,
    zIndex: 20,
  },
  pressable: {
    borderRadius: 28,
    shadowColor: '#9184d9',
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
