/**
 * Reloop Categories, Conditions and Validation Constants
 */

export const CATEGORIES = [
  { id: 'textbooks', label: 'Textbooks & Notes', icon: 'BookOpen' },
  { id: 'calculators', label: 'Calculators', icon: 'Calculator' },
  { id: 'electronics', label: 'Dev Boards & Electronics', icon: 'Cpu' },
  { id: 'robotics', label: 'Robotics & Hardware', icon: 'Bot' },
  { id: 'sensors', label: 'Sensors & Modules', icon: 'Radio' },
  { id: 'stationery', label: 'Drafting & Stationery', icon: 'PenTool' },
  { id: 'lab_gear', label: 'Lab Equipment & Probes', icon: 'Wrench' },
  { id: 'other', label: 'Other Permitted Essentials', icon: 'Layers' },
];

export const CONDITIONS = [
  { id: 'brand_new', label: 'Brand New (Unopened)' },
  { id: 'like_new', label: 'Like New (Minimal Use)' },
  { id: 'good', label: 'Good (Minor Cosmetic Wear)' },
  { id: 'fair', label: 'Fair (Fully Functional)' },
];

export const DURATION_OPTIONS = [
  { hours: 1, label: '1 Hour (Quick Auction)' },
  { hours: 6, label: '6 Hours' },
  { hours: 12, label: '12 Hours (Half Day)' },
  { hours: 24, label: '24 Hours (1 Day)' },
  { hours: 72, label: '3 Days (Weekend)' },
  { hours: 120, label: '5 Days' },
  { hours: 168, label: '7 Days (1 Week)' },
];

export function getCategoryLabel(catId) {
  const match = CATEGORIES.find(c => c.id === catId);
  return match ? match.label : catId;
}

export function getConditionLabel(condId) {
  const match = CONDITIONS.find(c => c.id === condId);
  return match ? match.label : condId;
}
