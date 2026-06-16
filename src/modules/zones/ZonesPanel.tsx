import { motion } from 'framer-motion';
import { Lock, Check } from 'lucide-react';
import { zones } from '@/data/zones';
import { stations } from '@/game/stations/stationZones';
import { useGameStore } from '@/state/store';
import NumberText from '@/ui/NumberText';
import ProgressBar from '@/ui/ProgressBar';

const stationName = (id: string) => stations.find((s) => s.id === id)?.nameAr ?? id;

export default function ZonesPanel() {
  const level = useGameStore((s) => s.player.level);

  return (
    <div>
      <p className="mb-5 font-body text-sm text-charcoal">
        The world of <span className="highlight">POWR</span> grows with you — new zones unlock as your level rises, bringing
        more buildings and extra perks.
      </p>
      <div className="space-y-3">
        {zones.map((z, i) => {
          const unlocked = level >= z.unlockLevel;
          return (
            <motion.div
              key={z.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="overflow-hidden rounded-lg shadow-soft"
              style={{ border: unlocked ? `2px solid ${z.color}` : '1px solid var(--color-warm-gray)', opacity: unlocked ? 1 : 0.9 }}
            >
              <div className="flex items-center gap-3 p-4" style={{ background: unlocked ? 'var(--color-white)' : 'var(--color-cream)' }}>
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-2xl"
                  style={{ background: z.color, filter: unlocked ? 'none' : 'grayscale(0.6)' }}
                >
                  {unlocked ? z.glyph : <Lock size={22} className="text-white" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-black text-black">{z.nameAr}</h3>
                    {unlocked ? (
                      <span className="flex items-center gap-1 rounded-pill bg-green-light px-2 py-0.5 font-ui text-[10px] font-bold text-black">
                        <Check size={11} /> Unlocked
                      </span>
                    ) : (
                      <span className="rounded-pill bg-warm-gray px-2 py-0.5 font-ui text-[10px] font-bold text-muted">
                        Unlocks at Level <NumberText value={z.unlockLevel} />
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 font-ui text-xs text-muted">{z.descAr}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {z.stations.map((s) => (
                      <span key={s} className="rounded-pill bg-off-white px-2 py-0.5 font-ui text-[11px] font-bold text-charcoal">
                        {stationName(s)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {!unlocked && (
                <div className="px-4 pb-3">
                  <div className="mb-1 flex items-center justify-between font-ui text-[10px] text-muted">
                    <span>Your progress</span>
                    <span className="num">Level <NumberText value={level} /> / <NumberText value={z.unlockLevel} /></span>
                  </div>
                  <ProgressBar pct={Math.min(100, (level / z.unlockLevel) * 100)} color={z.color} height={6} />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
