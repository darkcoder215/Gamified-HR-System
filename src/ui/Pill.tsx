import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  color?: string;
  bg?: string;
  className?: string;
}

export default function Pill({ children, color = 'var(--color-black)', bg = 'var(--color-green-light)', className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill px-3 py-1 font-ui text-xs font-bold ${className}`}
      style={{ color, background: bg }}
    >
      {children}
    </span>
  );
}
