// ─── Quidd Theme Colors ───────────────────────────────────────────────────────
// Dark mode:  Candy Pop + Cotton Candy Neon  (deep navy, neon pinks/purples/cyans)
// Light mode: Sunrise Rave                   (cream, warm oranges/corals/yellows)

export const dark = {
  // Backgrounds
  bg:           '#0a0a1a',   // deep navy base
  bgCard:       '#13132b',   // card surface
  bgElevated:   '#1a1a38',   // elevated/modal
  bgInput:      '#1e1e40',   // input fields

  // Brand / neon accents
  pink:         '#ff6ec7',   // candy pop pink — primary action
  purple:       '#c77dff',   // electric purple — secondary
  cyan:         '#3af4ff',   // cotton candy cyan — info/travel
  mint:         '#6bff9e',   // mint green — success/savings
  yellow:       '#ffca3a',   // golden yellow — warning/entertainment
  orange:       '#ff9f43',   // neon orange — bills
  lavender:     '#b8f0ff',   // soft lavender blue

  // Category colors
  categoryFood:          '#ff6ec7',
  categoryTravel:        '#3af4ff',
  categoryShopping:      '#c77dff',
  categoryHealth:        '#6bff9e',
  categoryEntertainment: '#ffca3a',
  categoryBills:         '#ff9f43',
  categorySavings:       '#b8f0ff',
  categoryOther:         '#888888',

  // Text
  textPrimary:   '#f0f0ff',
  textSecondary: '#9090bb',
  textMuted:     '#55557a',

  // Borders
  border:        'rgba(255,255,255,0.08)',
  borderStrong:  'rgba(255,255,255,0.16)',

  // Blobs (floating background elements)
  blob1:         'rgba(255,110,199,0.12)',
  blob2:         'rgba(199,125,255,0.10)',
  blob3:         'rgba(58,244,255,0.08)',

  // Status
  success:       '#6bff9e',
  error:         '#ff5c7a',
  warning:       '#ffca3a',

  // Misc
  tabBar:        '#0f0f28',
  statusBar:     'dark' as const,
};

export const light = {
  // Backgrounds
  bg:           '#fff8f0',   // warm cream
  bgCard:       '#ffffff',
  bgElevated:   '#fff3e6',
  bgInput:      '#ffeedd',

  // Brand / warm accents
  pink:         '#ff6b6b',   // coral red — primary action
  purple:       '#cc5de8',   // warm purple — secondary
  cyan:         '#4dabf7',   // sky blue — info/travel
  mint:         '#51cf66',   // fresh green — success/savings
  yellow:       '#ffa94d',   // sunrise orange — entertainment
  orange:       '#ff922b',   // deep orange — bills
  lavender:     '#74c0fc',   // soft blue

  // Category colors
  categoryFood:          '#ff6b6b',
  categoryTravel:        '#4dabf7',
  categoryShopping:      '#cc5de8',
  categoryHealth:        '#51cf66',
  categoryEntertainment: '#ffa94d',
  categoryBills:         '#ff922b',
  categorySavings:       '#74c0fc',
  categoryOther:         '#868e96',

  // Text
  textPrimary:   '#1a0800',
  textSecondary: '#7a4a2a',
  textMuted:     '#c09070',

  // Borders
  border:        'rgba(180,100,0,0.12)',
  borderStrong:  'rgba(180,100,0,0.22)',

  // Blobs (softer pastels for light mode)
  blob1:         'rgba(255,107,107,0.10)',
  blob2:         'rgba(255,159,67,0.10)',
  blob3:         'rgba(255,202,58,0.10)',

  // Status
  success:       '#51cf66',
  error:         '#ff6b6b',
  warning:       '#ffa94d',

  // Misc
  tabBar:        '#ffffff',
  statusBar:     'dark' as const,
};

export type ThemeColors = typeof dark;

// Gradient pairs for cards and backgrounds
export const gradients = {
  dark: {
    hero:     ['#0a0a1a', '#13132b'] as const,
    pink:     ['#ff6ec7', '#c77dff'] as const,
    cyan:     ['#3af4ff', '#6bff9e'] as const,
    warm:     ['#ff9f43', '#ffca3a'] as const,
    card:     ['rgba(255,110,199,0.08)', 'rgba(199,125,255,0.04)'] as const,
  },
  light: {
    hero:     ['#fff8f0', '#ffe8d6'] as const,
    pink:     ['#ff6b6b', '#cc5de8'] as const,
    cyan:     ['#4dabf7', '#51cf66'] as const,
    warm:     ['#ff922b', '#ffa94d'] as const,
    card:     ['rgba(255,107,107,0.06)', 'rgba(255,159,67,0.04)'] as const,
  },
};