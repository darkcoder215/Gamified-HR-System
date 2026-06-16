import { motion } from 'framer-motion';
import { Coins, Check, Lock, Zap, Sparkles } from 'lucide-react';
import { useGameStore } from '@/state/store';
import { frames } from '@/data/frames';
import { MAX_ENERGY } from '@/state/gamification';
import NumberText from '@/ui/NumberText';
import Button from '@/ui/Button';

const REFILL_PRICE = 40;

export default function Shop() {
  const coins = useGameStore((s) => s.coins);
  const ownedFrames = useGameStore((s) => s.ownedFrames);
  const equippedFrame = useGameStore((s) => s.player.frame);
  const energy = useGameStore((s) => s.player.energy);
  const buyFrame = useGameStore((s) => s.buyFrame);
  const equipFrame = useGameStore((s) => s.equipFrame);
  const buyEnergyRefill = useGameStore((s) => s.buyEnergyRefill);

  return (
    <div>
      {/* balance */}
      <div className="mb-5 flex items-center justify-between rounded-lg p-4" style={{ background: 'var(--color-yellow-pale)' }}>
        <span className="font-ui text-sm font-bold text-charcoal">Your Balance</span>
        <span className="flex items-center gap-1.5 font-display text-2xl font-black text-black">
          <Coins size={22} className="text-amber" /> <NumberText value={coins} group /> coins
        </span>
      </div>
      <p className="mb-4 font-ui text-xs text-muted">Earn coins from assessments, quests, and promotions, and spend them on looks and perks.</p>

      {/* Frames */}
      <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-black text-black">
        <Sparkles size={18} className="text-green" /> Avatar Frames
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {/* none */}
        <div className="flex flex-col items-center gap-2 rounded-lg bg-white p-3 shadow-soft">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-warm-gray font-ui text-[10px] font-bold text-muted">None</span>
          <button
            onClick={() => equipFrame(null)}
            className="w-full rounded-pill bg-black py-1.5 font-ui text-[11px] font-bold text-white disabled:opacity-40"
            disabled={!equippedFrame}
          >
            {!equippedFrame ? 'Equipped' : 'Remove Frame'}
          </button>
        </div>
        {frames.map((f) => {
          const owned = !!ownedFrames[f.id];
          const equipped = equippedFrame === f.id;
          const affordable = coins >= f.price;
          return (
            <motion.div key={f.id} whileHover={{ y: -3 }} className="flex flex-col items-center gap-2 rounded-lg bg-white p-3 shadow-soft">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full font-display text-base font-black text-white"
                style={{ background: '#2b2d3f', boxShadow: `0 0 0 3px ${f.ring}${f.glow ? `, 0 0 10px ${f.ring}` : ''}` }}
              >
                8
              </span>
              <span className="font-ui text-[11px] font-bold text-black">{f.nameAr}</span>
              {owned ? (
                <button
                  onClick={() => equipFrame(f.id)}
                  disabled={equipped}
                  className="w-full rounded-pill py-1.5 font-ui text-[11px] font-bold text-white disabled:opacity-50"
                  style={{ background: equipped ? 'var(--color-muted)' : 'var(--color-green)' }}
                >
                  {equipped ? '✓ Equipped' : 'Equip'}
                </button>
              ) : (
                <button
                  onClick={() => buyFrame(f.id, f.price)}
                  disabled={!affordable}
                  className="flex w-full items-center justify-center gap-1 rounded-pill bg-black py-1.5 font-ui text-[11px] font-bold text-white disabled:opacity-40"
                >
                  {affordable ? <Coins size={11} className="text-amber" /> : <Lock size={11} />}
                  <NumberText value={f.price} />
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Perks */}
      <h3 className="mb-3 mt-6 flex items-center gap-2 font-display text-lg font-black text-black">
        <Zap size={18} className="text-amber" /> Perks
      </h3>
      <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-md text-white" style={{ background: 'var(--color-amber)' }}>
            <Zap size={20} />
          </span>
          <div>
            <p className="font-ui text-sm font-bold text-black">Full Energy Refill</p>
            <p className="font-ui text-xs text-muted">Instantly restore your energy to keep battling.</p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => buyEnergyRefill(REFILL_PRICE)}
          disabled={coins < REFILL_PRICE || energy >= MAX_ENERGY}
        >
          <span className="flex items-center gap-1">
            {energy >= MAX_ENERGY ? 'Full' : <><Coins size={12} className="text-amber" /> <NumberText value={REFILL_PRICE} /></>}
            {energy >= MAX_ENERGY ? <Check size={14} /> : null}
          </span>
        </Button>
      </div>
    </div>
  );
}
