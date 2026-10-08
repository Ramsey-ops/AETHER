import { useRef, useState } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter'
import { BriefingScreen } from './src/screens/Briefing/BriefingScreen'
import { AnalysisScreen } from './src/screens/Analysis/AnalysisScreen'
import { MarketsScreen } from './src/screens/Markets/MarketsScreen'
import { NewsScreen } from './src/screens/News/NewsScreen'
import { JournalScreen } from './src/screens/Journal/JournalScreen'
import { LogTradeScreen } from './src/screens/Journal/LogTradeScreen'
import { GoalsScreen } from './src/screens/Goals/GoalsScreen'
import { ChartAnalysisScreen } from './src/screens/ChartAnalysis/ChartAnalysisScreen'
import { FloatingAIButton } from './src/components/FloatingAIButton/FloatingAIButton'
import type { TabKey } from './src/components/BottomTabBar/BottomTabBar'
import { color } from './src/theme/tokens'

type PairOrigin = 'briefing' | 'markets'

type Route =
  | { screen: 'briefing' }
  | { screen: 'markets' }
  | { screen: 'news' }
  | { screen: 'journal' }
  | { screen: 'logTrade'; initialSymbol?: string }
  | { screen: 'goals' }
  | { screen: 'analysis'; symbol: string; from: PairOrigin }
  | { screen: 'chartAnalysis' }

// The 6 core screens plus screen 7 (AI Assistant / Chart Analysis, reached
// only through the FloatingAIButton). A minimal in-app router — real
// navigation state, no placeholder screens. Revisit with a proper
// navigation library once the stack gets deeper than a couple of levels.
export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  })
  const [route, setRoute] = useState<Route>({ screen: 'briefing' })
  const [previousRoute, setPreviousRoute] = useState<Route>({ screen: 'briefing' })
  const [fabOpening, setFabOpening] = useState(false)
  const chartAnalysisAnim = useRef(new Animated.Value(0)).current

  if (!fontsLoaded) {
    return <View style={styles.root} />
  }

  function onSelectTab(tab: TabKey) {
    if (tab === 'today') {
      setRoute({ screen: 'briefing' })
      return
    }
    if (tab === 'markets') {
      setRoute({ screen: 'markets' })
      return
    }
    if (tab === 'news') {
      setRoute({ screen: 'news' })
      return
    }
    if (tab === 'journal') {
      setRoute({ screen: 'journal' })
      return
    }
    if (tab === 'goals') {
      setRoute({ screen: 'goals' })
    }
  }

  function openAnalysis(symbol: string, from: PairOrigin) {
    setRoute({ screen: 'analysis', symbol, from })
  }

  function openChartAnalysis() {
    setPreviousRoute(route)
    setFabOpening(true)
    // Small beat before the screen mounts — the FAB spins briefly, matching
    // the approved design's "Opening" state, rather than an instant cut.
    setTimeout(() => {
      setRoute({ screen: 'chartAnalysis' })
      chartAnalysisAnim.setValue(0)
      Animated.timing(chartAnalysisAnim, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setFabOpening(false))
    }, 150)
  }

  function closeChartAnalysis(next?: Route) {
    Animated.timing(chartAnalysisAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setRoute(next ?? previousRoute))
  }

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        {route.screen === 'briefing' && (
          <BriefingScreen
            onSelectPair={(symbol) => openAnalysis(symbol, 'briefing')}
            onSelectTab={onSelectTab}
          />
        )}
        {route.screen === 'markets' && (
          <MarketsScreen
            onSelectPair={(symbol) => openAnalysis(symbol, 'markets')}
            onSelectTab={onSelectTab}
          />
        )}
        {route.screen === 'news' && <NewsScreen onSelectTab={onSelectTab} />}
        {route.screen === 'journal' && (
          <JournalScreen
            onLogTrade={() => setRoute({ screen: 'logTrade' })}
            onSelectTab={onSelectTab}
          />
        )}
        {route.screen === 'logTrade' && (
          <LogTradeScreen
            initialSymbol={route.initialSymbol}
            onDone={() => setRoute({ screen: 'journal' })}
            onCancel={() => setRoute({ screen: 'journal' })}
          />
        )}
        {route.screen === 'goals' && <GoalsScreen onSelectTab={onSelectTab} />}
        {route.screen === 'analysis' && (
          <AnalysisScreen
            symbol={route.symbol}
            onBack={() => setRoute({ screen: route.from })}
            onSelectTab={onSelectTab}
            onLogToJournal={(symbol) => setRoute({ screen: 'logTrade', initialSymbol: symbol })}
          />
        )}

        {route.screen === 'chartAnalysis' && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.chartAnalysisOverlay,
              {
                opacity: chartAnalysisAnim,
                transform: [
                  { translateY: chartAnalysisAnim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) },
                ],
              },
            ]}
          >
            <ChartAnalysisScreen
              onBack={() => closeChartAnalysis()}
              onSaveToJournal={(symbol) => closeChartAnalysis({ screen: 'logTrade', initialSymbol: symbol })}
              onComparePrimary={(symbol) => closeChartAnalysis({ screen: 'analysis', symbol, from: 'markets' })}
            />
          </Animated.View>
        )}

        {route.screen !== 'chartAnalysis' && <FloatingAIButton onPress={openChartAnalysis} opening={fabOpening} />}

        <StatusBar style="light" />
      </View>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.canvas,
  },
  chartAnalysisOverlay: {
    backgroundColor: color.canvas,
  },
})
