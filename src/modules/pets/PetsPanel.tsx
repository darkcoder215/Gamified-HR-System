import { motion } from 'framer-motion';
import { Lock, Check } from 'lucide-react';
import { useGameStore } from '@/state/store';
import { pets } from '@/data/pets';
import PetSprite from '@/ui/PetSprite';

export default function PetsPanel() {
  const owned = useGameStore((s) => s.pets);
  const equipped = useGameStore((s) => s.equippedPet);
  const equipPet = useGameStore((s) => s.equipPet);

  const count = Object.keys(owned).length;

  return (
    <div>
      <p className="mb-4 font-body text-sm text-charcoal">
        رفاقك يرافقونك في العالم ويظهرون لزملائك في <span className="highlight">لوحة الصدارة</span> — تُكتسب
        بإنجازاتك الحقيقية. لديك <span className="num">{count}</span> من <span className="num">{pets.length}</span>.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {pets.map((p, i) => {
          const has = !!owned[p.id];
          const isEq = equipped === p.id;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="flex flex-col items-center rounded-lg bg-white p-4 text-center shadow-soft"
              style={{ opacity: has ? 1 : 0.6 }}
            >
              <motion.div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: has ? `${p.color}22` : 'var(--color-warm-gray)' }}
                animate={has ? { y: [0, -5, 0] } : {}}
                transition={{ duration: 2 + i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                {has ? <PetSprite id={p.id} size={48} /> : <Lock size={22} className="text-muted" />}
              </motion.div>
              <p className="mt-2 font-ui text-sm font-bold text-black">{p.nameAr}</p>
              <span className="rounded-pill px-2 py-0.5 font-ui text-[10px] font-bold" style={{ background: 'var(--color-warm-gray)', color: 'var(--color-muted)' }}>{p.rarity}</span>
              <p className="mt-1 font-ui text-[11px] leading-tight text-muted">{p.descAr}</p>
              {has && (
                <button
                  onClick={() => equipPet(isEq ? null : p.id)}
                  className="mt-2 w-full rounded-pill py-1.5 font-ui text-[11px] font-bold text-white"
                  style={{ background: isEq ? 'var(--color-muted)' : 'var(--color-green)' }}
                >
                  {isEq ? <span className="flex items-center justify-center gap-1"><Check size={12} /> مُرافِق</span> : 'اصطحبه'}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
