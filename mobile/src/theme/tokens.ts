/**
 * Ported from the Nocturne design system's CSS custom properties
 * (design/_ds/nocturne-.../styles.css + the app-specific aliases in the
 * original web app's src/styles/app-tokens.css). React Native has no CSS
 * custom properties or color-mix(), so these are flattened to literal
 * values — keep this file as the single source of truth if the palette
 * changes, rather than hunting through StyleSheets.
 */

export const color = {
  bg: '#161826',
  surface: '#232532',
  text: '#e9e9ed',
  accent: '#9184d9',
  accent2: '#a7a1db',
  divider: 'rgba(233, 233, 237, 0.16)',

  neutral300: '#cfd3e5',
  neutral400: '#b2b6ca',
  neutral500: '#9397ab',
  neutral600: '#75798c',
  neutral800: '#3f424d',

  accent300: '#d2cefd',
  accent400: '#b5abfc',
  accent500: '#968ae0',
  accent700: '#5d5294',
  accent800: '#423a6a',
  accent900: '#2b2741',

  // Aether-specific semantic aliases (the "--c-*" tokens in the reference).
  canvas: '#0f1018',
  raised: '#1c1e2c',
  surface2: '#242636',
  sunken: '#1a1c29',
  track: '#2b2d3b',
  text2: '#cfd3e5',
  text3: '#b2b6ca',
  muted: '#9397ab',
  dim: '#75798c',
  up: '#8fce9f',
  down: '#e0a3a3',
  downStrong: '#c46a6a',
  caution: '#c9b98a',
  cautionText: '#d8d2bd',
} as const

export const space = {
  1: 2.8,
  2: 5.6,
  3: 8.4,
  4: 11.2,
  6: 16.8,
  8: 22.4,
} as const

export const radius = {
  sm: 4,
  md: 8,
  lg: 14,
} as const

/**
 * @expo-google-fonts/inter exposes one font-family name per weight (RN has
 * no CSS `font-weight` on custom fonts) — these must match the names passed
 * to `useFonts()` in App.tsx.
 */
export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const
