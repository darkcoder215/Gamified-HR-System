import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  accent?: string;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  accent = 'var(--color-green)',
  children,
  maxWidth = '720px',
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          initial={{ opacity: 0, pointerEvents: 'none' }}
          animate={{ opacity: 1, pointerEvents: 'auto' }}
          exit={{ opacity: 0, pointerEvents: 'none' }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={onClose}
          />
          <motion.div
            className="relative z-10 max-h-[90vh] w-full overflow-hidden rounded-xl bg-off-white shadow-float"
            style={{ maxWidth }}
            initial={{ scale: 0.92, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <header
              className="flex items-center gap-3 px-6 py-5"
              style={{ background: 'var(--color-white)', borderBottom: '1px solid var(--color-warm-gray)' }}
            >
              {icon && (
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-white"
                  style={{ background: accent }}
                >
                  {icon}
                </div>
              )}
              <div className="min-w-0 flex-1">
                {title && (
                  <h2 className="font-display text-2xl font-black leading-tight text-black">{title}</h2>
                )}
                {subtitle && <p className="font-ui text-sm text-muted">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-warm-gray"
                aria-label="إغلاق"
              >
                <X size={20} />
              </button>
            </header>
            <div className="max-h-[calc(90vh-88px)] overflow-y-auto p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
