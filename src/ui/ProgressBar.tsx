import { motion } from 'framer-motion';

interface Props {
  pct: number; // 0-100
  color?: string;
  track?: string;
  height?: number;
  glow?: boolean;
}

export default function ProgressBar({
  pct,
  color = 'var(--color-green)',
  track = 'var(--color-warm-gray)',
  height = 8,
  glow = false,
}: Props) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div
      className="w-full overflow-hidden rounded-pill"
      style={{ background: track, height }}
    >
      <motion.div
        className="h-full rounded-pill"
        style={{ background: color, boxShadow: glow ? `0 0 12px ${color}` : undefined }}
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      />
    </div>
  );
}
