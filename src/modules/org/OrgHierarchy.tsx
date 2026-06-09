import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, Loader2, X, Sparkles } from 'lucide-react';
import { useGameStore } from '@/state/store';
import { orgTiers, executive, executiveTitleAr, type OrgPerson } from '@/data/orgChart';
import { fileToScaledDataURL, generatePixelAvatar } from '@/lib/avatar';
import NumberText from '@/ui/NumberText';

function Avatar({
  person,
  image,
  ring,
  onGenerate,
}: {
  person: OrgPerson;
  image?: string | null;
  ring?: boolean;
  onGenerate?: () => void;
}) {
  return (
    <div className="relative">
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
      {onGenerate && (
        <button
          onClick={onGenerate}
          title="توليد صورة بالذكاء الاصطناعي"
          className="absolute -bottom-1 -start-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-white shadow-card transition hover:bg-charcoal"
        >
          <Camera size={11} />
        </button>
      )}
    </div>
  );
}

export default function OrgHierarchy() {
  const player = useGameStore((s) => s.player);
  const currentRung = useGameStore((s) => s.promotionStatus.currentRung);
  const colleagueAvatars = useGameStore((s) => s.colleagueAvatars);
  const setColleagueAvatar = useGameStore((s) => s.setColleagueAvatar);

  const [gen, setGen] = useState<{ id: string; name: string } | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const openGen = (id: string, name: string) => {
    setGen({ id, name });
    setPhoto(null);
    setMsg(null);
  };

  const run = async () => {
    if (!photo || !gen) return;
    setLoading(true);
    setMsg(null);
    const r = await generatePixelAvatar(photo);
    if (r.needsKey) setMsg('يعمل التوليد في بيئة الإنتاج بعد إضافة مفتاح OPENAI_API_KEY.');
    else if (r.error) setMsg(r.error);
    else if (r.image) {
      setColleagueAvatar(gen.id, r.image);
      setGen(null);
    }
    setLoading(false);
  };

  return (
    <div className="relative">
      <p className="mb-5 font-body text-sm text-charcoal">
        هذا هو فريق <span className="highlight">ثمانية</span>. كلما ارتقيت صعدت في الهيكل التنظيمي واقتربت من القيادة.
        موقعك مميَّز بالأخضر — ويمكنك توليد صور الزملاء بالذكاء الاصطناعي عبر زر <Camera size={12} className="inline" />.
      </p>

      {/* Executive */}
      <div className="flex flex-col items-center">
        <div className="flex flex-col items-center gap-1 rounded-lg bg-black px-5 py-3 text-center">
          <Avatar person={executive} image={colleagueAvatars[executive.id]} onGenerate={() => openGen(executive.id, executive.nameAr)} />
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
                    <Avatar person={p} image={colleagueAvatars[p.id]} onGenerate={() => openGen(p.id, p.nameAr)} />
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
                    <span className="font-ui text-[11px] font-bold leading-tight text-green">{player.nameAr} (أنت)</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* AI generation overlay */}
      {gen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-10 flex items-center justify-center rounded-xl p-4"
          style={{ background: 'rgba(247,244,238,0.95)', backdropFilter: 'blur(2px)' }}
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-float">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-black text-black">توليد صورة {gen.name}</h3>
              <button onClick={() => setGen(null)} className="text-muted hover:text-black"><X size={18} /></button>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-warm-gray bg-off-white text-muted transition hover:border-green"
            >
              {photo ? (
                <img src={photo} alt="" className="h-full w-full rounded-lg object-cover" />
              ) : (
                <>
                  <Upload size={24} />
                  <span className="font-ui text-xs font-bold">اختر صورة الزميل</span>
                </>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) setPhoto(await fileToScaledDataURL(f));
            }} />
            <button
              onClick={run}
              disabled={!photo || loading}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-pill bg-green py-2.5 font-ui text-sm font-bold text-white disabled:opacity-50"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> جارٍ التوليد…</> : <><Sparkles size={16} /> ولّد الصورة</>}
            </button>
            {msg && <p className="mt-3 rounded-lg bg-yellow-pale p-2 font-ui text-[11px] text-charcoal" style={{ background: 'var(--color-yellow-pale)' }}>{msg}</p>}
          </div>
        </motion.div>
      )}
    </div>
  );
}
