export interface PresetColor {
  label: string;
  value: string;
}

export const PRESET_COLORS: PresetColor[] = [
  // Reds & Pinks
  { label: 'Red',      value: '#f43f5e' },
  { label: 'Rose',     value: '#fb7185' },
  { label: 'Pink',     value: '#f472b6' },
  { label: 'Hot Pink', value: '#ec4899' },

  // Purples
  { label: 'Mauve',    value: '#c084fc' },
  { label: 'Violet',   value: '#a78bfa' },
  { label: 'Indigo',   value: '#818cf8' },
  { label: 'Purple',   value: '#9333ea' },

  // Blues
  { label: 'Sky',      value: '#38bdf8' },
  { label: 'Blue',     value: '#3b82f6' },
  { label: 'Cobalt',   value: '#2563eb' },
  { label: 'Navy',     value: '#1d4ed8' },

  // Cyans & Teals
  { label: 'Cyan',     value: '#22d3ee' },
  { label: 'Teal',     value: '#2dd4bf' },
  { label: 'Aqua',     value: '#06b6d4' },

  // Greens
  { label: 'Mint',     value: '#86efac' },
  { label: 'Sage',     value: '#4ade80' },
  { label: 'Emerald',  value: '#34d399' },
  { label: 'Green',    value: '#22c55e' },
  { label: 'Forest',   value: '#16a34a' },
  { label: 'Lime',     value: '#84cc16' },

  // Yellows & Oranges
  { label: 'Yellow',   value: '#facc15' },
  { label: 'Amber',    value: '#fbbf24' },
  { label: 'Gold',     value: '#f59e0b' },
  { label: 'Orange',   value: '#fb923c' },
  { label: 'Coral',    value: '#f97066' },
  { label: 'Peach',    value: '#fdba74' },

  // Neutrals
  { label: 'Stone',    value: '#a8a29e' },
  { label: 'Slate',    value: '#94a3b8' },
  { label: 'Charcoal', value: '#475569' },
];

export const DEFAULT_COLOR = '#3b82f6';
