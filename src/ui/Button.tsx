import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

type Variant = 'primary' | 'accent' | 'secondary' | 'danger' | 'ghost';

interface Props extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: Variant;
  children: ReactNode;
}

export default function Button({ variant = 'primary', children, className = '', ...rest }: Props) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      className={`btn btn-${variant} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
