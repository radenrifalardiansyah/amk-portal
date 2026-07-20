// Shared design tokens for the admin panel — one elegant accent color on a light surface.
export const theme = {
  bg: '#F5F7FB',
  surface: '#FFFFFF',
  surfaceSoft: '#FAFBFD',
  border: '#E7EAF2',
  borderHover: '#D7DDE9',
  divider: '#EEF1F7',

  text: '#101828',
  textSecondary: '#5B6472',
  textMuted: '#98A2B3',

  accent: '#0752B7',
  accentDark: '#06469C',
  cyan: '#5DE1E6',
  accentSoft: 'rgba(7,82,183,0.07)',
  accentSoftHover: 'rgba(7,82,183,0.13)',
  accentSoftBorder: 'rgba(7,82,183,0.18)',
  accentText: '#06469C',

  danger: '#DC2626',
  dangerSoft: 'rgba(220,38,38,0.06)',
  dangerSoftHover: 'rgba(220,38,38,0.12)',

  shadowCard: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.05)',
  shadowCardHover: '0 8px 20px rgba(16,24,40,0.07), 0 2px 6px rgba(16,24,40,0.04)',
  shadowElevated: '0 24px 64px rgba(16,24,40,0.14)',

  fontHeadline: "'Space Grotesk', sans-serif",

  chartPalette: ['#0752B7', '#5DE1E6', '#7089C0', '#58C2C4', '#3D72BA', '#57A8CE'],
} as const

export const inputStyle = {
  border: `1.5px solid ${theme.border}`,
  background: theme.surfaceSoft,
  color: theme.text,
}

export const inputFocusStyle = {
  borderColor: theme.accent,
  background: theme.accentSoft,
}

export const inputBlurStyle = inputStyle
