import { motion } from 'framer-motion';
import { useGameStore } from '@/state/store';
import { orgTiers, executive, executiveTitleAr, type OrgPerson } from '@/data/orgChart';
import NumberText from '@/ui/NumberText';

function Avatar({ person, image, ring }: { person: OrgPerson; image?: string | null; ring?: boolean }) {
  return (
    <div
      className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full font-display text-lg font-black text-white"
      style={{ background: person.avatar, boxShadow: ring ? '0 0 0 3px var(--color-green)' : undefined }}
    >
      {image ? (
        <img src={image} alt="" className="h-full w-full object-cover" style={{ imageRendering: 'pixelated' }} />
      ) : (
        person.nameAr.trim().charAt(0)
      )}
      {person.glyph && <span className="absolute -bottom-1 -end-1 text-sm">{person.glyph}</span>}
    </div>
  );
}

export default function OrgHierarchy() {
  const player = useGameStore((s) => s.player);
  const currentRung = useGameStore((s) => s.promotionStatus.currentRung);

  return (
    <div>
      <p className="mb-5 font-body text-sm text-charcoal">
        هذا هو فريق <span className="highlight">ثمانية</span>. كلما ارتقيت في المستوى، صعدت في الهيكل
        التنظيمي واقتربت من القيادة. موقعك الحالي مميَّز باللون الأخضر.
      </p>

      {/* Executive */}
      <div className="flex flex-col items-center">
        <div className="flex flex-col items-center gap-1 rounded-lg bg-black px-5 py-3 text-center">
          <Avatar person={executive} />
          <p className="font-ui text-sm font-bold text-white">{executive.nameAr}</p>
          <p className="font-ui text-[11px] text-white/60">{executiveTitleAr}</p>
        </div>
        <div className="h-5 w-px bg-warm-gray" />
      </div>

      {/* Tiers */}
      <div className="space-y-3">
        {orgTiers.map((tier, i) => {
          const isPlayerTier = tier.level === currentRung;
          return (
            <motion.div
              key={tier.level}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-lg p-3"
              style={{
                background: isPlayerTier ? 'var(--color-green-light)' : 'var(--color-white)',
                border: isPlayerTier ? '2px solid var(--color-green)' : '1px solid var(--color-warm-gray)',
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-ui text-xs font-bold text-charcoal">{tier.titleAr}</span>
                <span className="rounded-pill bg-warm-gray px-2 py-0.5 font-ui text-[10px] font-bold text-muted">
                  المستوى <NumberText value={tier.level} />
                </span>
              </div>
              <div className="flex flex-wrap items-start gap-4">
                {tier.people.map((p) => (
                  <div key={p.id} className="flex w-16 flex-col items-center gap-1 text-center">
                    <Avatar person={p} />
                    <span className="font-ui text-[11px] leading-tight text-charcoal">{p.nameAr}</span>
                  </div>
                ))}
                {isPlayerTier && (
                  <div className="flex w-16 flex-col items-center gap-1 text-center">
                    <Avatar
                      person={{ id: 'you', nameAr: player.nameAr, avatar: player.avatar, glyph: '⭐' }}
                      image={player.avatarImage}
                      ring
                    />
                    <span className="font-ui text-[11px] font-bold leading-tight text-green">
                      {player.nameAr} (أنت)
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
