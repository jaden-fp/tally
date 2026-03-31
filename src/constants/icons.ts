// Curated habit icon list — all names verified against lucide-react-native@0.469.x exports.
// Icons are kebab-case and map to PascalCase component names (e.g. "heart-pulse" → HeartPulse).

export const HABIT_ICONS: string[] = [
  // ── Health & Body ──────────────────────────────────────────────────────────
  'heart',
  'heart-pulse',
  'pill',
  'syringe',
  'thermometer',
  'eye',
  'ear',
  'hand',
  'footprints',
  'bone',

  // ── Food & Drink ───────────────────────────────────────────────────────────
  'apple',
  'banana',
  'beef',
  'egg',
  'fish',
  'grape',
  'salad',
  'sandwich',
  'pizza',
  'soup',
  'utensils',
  'cooking-pot',
  'microwave',
  'refrigerator',
  'coffee',
  'cup-soda',
  'beer',
  'wine',
  'milk',
  'ice-cream-cone',
  'candy',
  'cherry',
  'citrus',
  'carrot',
  'nut',

  // ── Baking ─────────────────────────────────────────────────────────────────
  'cake',
  'cake-slice',
  'croissant',
  'cookie',
  'wheat',
  // Unavailable in current lucide version: 'cupcake', 'bread'

  // ── Cheese ─────────────────────────────────────────────────────────────────
  'triangle', // cheese wedge stand-in — no dedicated wedge/cheese icon in lucide

  // ── Fitness & Activity ─────────────────────────────────────────────────────
  'dumbbell',
  'bike',
  'flame',
  'zap',
  'timer',
  'trophy',
  'target',
  'mountain',

  // ── Mind & Learning ────────────────────────────────────────────────────────
  'book-open',
  'book',
  'brain',
  'graduation-cap',
  'pen-tool',
  'notebook-pen',
  'lightbulb',

  // ── Lifestyle ──────────────────────────────────────────────────────────────
  'bed',
  'alarm-clock',
  'shower-head', // 'shower' not in lucide; shower-head is the closest alternative
  'shirt',
  'glasses',
  'music',
  'headphones',
  'camera',
  'palette',
  'scissors',
  'sparkles',

  // ── Nature & Wellness ──────────────────────────────────────────────────────
  'leaf',
  'sun',
  'moon',
  'cloud-sun',
  'droplets',
  'flower',
  'trees',
  'sprout',

  // ── Home & Chores ──────────────────────────────────────────────────────────
  'home',
  'washing-machine',
  'trash-2',
  // Unavailable in current lucide version: 'broom'
  'dog',
  'cat',
  'baby',

  // ── Social & Communication ────────────────────────────────────────────────
  'phone',
  'message-square',
  'users',
  'smile',
  'hand-heart',

  // ── Finance & Work ────────────────────────────────────────────────────────
  'wallet',
  'piggy-bank',
  'briefcase',
  'calendar-check',
  'clock',
  'check-square',

  // ── Brushes & Art ─────────────────────────────────────────────────────────
  'brush',
  'paintbrush',
];

// Custom icons that require a hand-rolled SVG component.
// TODO: Add custom tooth SVG icon component at src/components/icons/ToothIcon.tsx
export const CUSTOM_ICONS: string[] = ['tooth'];

export const DEFAULT_ICON = 'zap';
