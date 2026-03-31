export interface PresetColor {
  label: string;
  value: string;
}

// 16 muted-but-distinct colors that read well on white backgrounds.
export const PRESET_COLORS: PresetColor[] = [
  { label: 'Sky',       value: '#5b9cf6' },  // soft blue
  { label: 'Indigo',    value: '#818cf8' },  // periwinkle
  { label: 'Violet',    value: '#a78bfa' },  // light purple
  { label: 'Pink',      value: '#f472b6' },  // bubblegum pink
  { label: 'Rose',      value: '#fb7185' },  // soft coral-red
  { label: 'Coral',     value: '#f97066' },  // warm coral
  { label: 'Amber',     value: '#fbbf24' },  // golden amber
  { label: 'Lime',      value: '#84cc16' },  // lime green
  { label: 'Emerald',   value: '#34d399' },  // soft emerald
  { label: 'Teal',      value: '#2dd4bf' },  // teal
  { label: 'Cyan',      value: '#22d3ee' },  // bright cyan
  { label: 'Sage',      value: '#86efac' },  // sage green
  { label: 'Slate',     value: '#94a3b8' },  // cool slate
  { label: 'Stone',     value: '#a8a29e' },  // warm stone
  { label: 'Mauve',     value: '#c084fc' },  // soft mauve
  { label: 'Peach',     value: '#fdba74' },  // soft peach
];

export const DEFAULT_COLOR = '#5b9cf6';
