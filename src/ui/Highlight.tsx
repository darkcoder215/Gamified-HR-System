import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  color?: string;
}

// The brand's signature highlight style — colored background behind key text.
export default function Highlight({ children, color = 'var(--color-green-light)' }: Props) {
  return (
    <span style={{ background: color, padding: '2px 8px', borderRadius: 4 }}>{children}</span>
  );
}
