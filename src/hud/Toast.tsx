import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';
import { EventBus } from '@/game/EventBus';
import { zoneForStation } from '@/data/zones';
import { sfx } from '@/audio/sound';
import NumberText from '@/ui/NumberText';

type Msg =
  | { kind: 'locked'; text: string; level?: number }
  | { kind: 'reward'; text: string };

export default function Toast() {
  const [msg, setMsg] = useState<Msg | null>(null);

  useEffect(() => {
    const onLocked = (p: { stationId: string }) => {
      const z = zoneForStation(p.stationId as never);
      sfx('wrong');
      setMsg({ kind: 'locked', text: z ? `«${z.nameAr}» مغلق — يفتح عند المستوى` : 'هذا المكان مغلق حاليًا', level: z?.unlockLevel });
      window.setTimeout(() => setMsg(null), 2600);
    };
    const onReward = (p: { text: string }) => {
      setMsg({ kind: 'reward', text: p.text });
      window.setTimeout(() => setMsg(null), 2600);
    };
    EventBus.on('station:locked', onLocked);
    EventBus.on('reward:toast', onReward);
    return () => {
      EventBus.off('station:locked', onLocked);
      EventBus.off('reward:toast', onReward);
    };
  }, []);

  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="pointer-events-none fixed bottom-44 left-1/2 z-50 -translate-x-1/2 sm:bottom-24"
        >
          <div className="flex items-center gap-2 rounded-pill bg-black/85 px-4 py-2 font-ui text-sm font-bold text-white shadow-float backdrop-blur">
            {msg.kind === 'reward' ? (
              <Sparkles size={15} className="text-amber" />
            ) : (
              <Lock size={15} className="text-amber" />
            )}
            {msg.text}
            {msg.kind === 'locked' && msg.level !== undefined && (
              <span className="num"><NumberText value={msg.level} /></span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
