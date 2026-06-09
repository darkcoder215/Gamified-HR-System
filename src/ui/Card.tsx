import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export default function Card({ children, className = '', onClick, interactive }: Props) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={interactive ? { y: -4, boxShadow: 'var(--shadow-lg)' } : undefined}
      className={`card ${interactive ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
}
