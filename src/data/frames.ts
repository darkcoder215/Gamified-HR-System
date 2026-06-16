import type { CSSProperties } from 'react';

export interface Frame {
  id: string;
  nameAr: string;
  price: number;
  ring: string;
  glow?: boolean;
}

// Cosmetic avatar frames sold in the rewards shop.
export const frames: Frame[] = [
  { id: 'emerald', nameAr: 'Emerald Frame', price: 100, ring: '#00c17a', glow: true },
  { id: 'gold', nameAr: 'Gold Frame', price: 120, ring: '#ffbc0a', glow: true },
  { id: 'royal', nameAr: 'Royal Frame', price: 140, ring: '#82003a' },
  { id: 'diamond', nameAr: 'Diamond Frame', price: 180, ring: '#84dbe5', glow: true },
  { id: 'neon', nameAr: 'Neon Frame', price: 200, ring: '#ff00b7', glow: true },
];

export function frameStyle(id: string | null | undefined): CSSProperties {
  if (!id) return {};
  const f = frames.find((x) => x.id === id);
  if (!f) return {};
  return { boxShadow: `0 0 0 3px ${f.ring}${f.glow ? `, 0 0 12px ${f.ring}` : ''}` };
}
