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

  accent: '#2563EB',
  accentDark: '#1D4ED8',
  accentSoft: 'rgba(37,99,235,0.07)',
  accentSoftHover: 'rgba(37,99,235,0.13)',
  accentSoftBorder: 'rgba(37,99,235,0.18)',
  accentText: '#1D4ED8',

  danger: '#DC2626',
  dangerSoft: 'rgba(220,38,38,0.06)',
  dangerSoftHover: 'rgba(220,38,38,0.12)',

  shadowCard: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.05)',
  shadowCardHover: '0 8px 20px rgba(16,24,40,0.07), 0 2px 6px rgba(16,24,40,0.04)',
  shadowElevated: '0 24px 64px rgba(16,24,40,0.14)',

  fontHeadline: "'Space Grotesk', sans-serif",

  chartPalette: ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DB2777', '#0891B2'],
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
