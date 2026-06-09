import { motion } from 'framer-motion';
import NumberText from './NumberText';
import { scoreColor, scoreLabel } from '@/lib/score';

interface Props {
  score: number; // 0-100
  size?: number;
}

// Large radial score display per brand component pattern §8.1 / §10.3.
export default function ScoreBadge({ score, size = 160 }: Props) {
  const color = scoreColor(score);
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-warm-gray)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-4xl font-black" style={{ color }}>
          <NumberText value={score} />
        </span>
        <span className="font-ui text-xs font-bold text-muted">{scoreLabel(score)}</span>
      </div>
    </div>
  );
}
