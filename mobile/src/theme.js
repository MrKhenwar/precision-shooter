// Design tokens for the Precision Shooter app — dark-navy surfaces with a
// high-vis blue accent, matching the reference design.
export const theme = {
  colors: {
    bg: '#0A0E14', // near-black navy (space between cards)
    surface: '#141B26', // card background
    surfaceAlt: '#1B2430', // raised / inner tiles
    surfaceMuted: '#10161F',
    primary: '#2F6BED', // high-vis blue (buttons, active states)
    primaryDim: 'rgba(47,107,237,0.15)',
    primaryText: '#FFFFFF',
    text: '#F2F5F9',
    textMuted: '#8A97A7',
    textFaint: '#5C6879',
    border: '#232E3C',
    borderSoft: '#1C2531',
    success: '#33C77D',
    successDim: 'rgba(51,199,125,0.14)',
    danger: '#F0554B',
    dangerDim: 'rgba(240,85,75,0.14)',
    warning: '#F2A93B',
    warningDim: 'rgba(242,169,59,0.14)',
    orange: '#F5883B',
    gold: '#E7B84B',
    goldDim: 'rgba(231,184,75,0.16)',
    purple: '#8B5CF6',
    pink: '#E0509A',
    cyan: '#38BDF8',
  },
  // Persona / accent colour helpers.
  accents: {
    green: '#33C77D',
    blue: '#2F6BED',
    orange: '#F5883B',
    purple: '#8B5CF6',
    pink: '#E0509A',
  },
  spacing: (n) => n * 8,
  radius: 16,
  radiusSm: 12,
};

// Display labels for personas.
export const PERSONAS = {
  athlete: 'Athlete',
  coach: 'Coach',
  parent: 'Parent',
  expert: 'External Expert',
};
