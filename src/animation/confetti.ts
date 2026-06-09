import confetti from 'canvas-confetti';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const BRAND = ['#00c17a', '#0072f9', '#ffbc0a', '#ff00b7', '#82003a', '#84dbe5'];

export function celebrate() {
  if (reduced()) return;
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: BRAND });
  setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0 }, colors: BRAND }), 150);
  setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1 }, colors: BRAND }), 300);
}

export function smallBurst() {
  if (reduced()) return;
  confetti({ particleCount: 50, spread: 55, origin: { y: 0.7 }, colors: BRAND, scalar: 0.8 });
}
