import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, Loader2, X, Sparkles } from 'lucide-react';
import { useGameStore } from '@/state/store';
import { orgTiers, executive, executiveTitleAr, type OrgPerson } from '@/data/orgChart';
import { fileToScaledDataURL, generatePixelAvatar } from '@/lib/avatar';
import { hasSupabase, supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import NumberText from '@/ui/NumberText';

interface RealPerson { id: string; full_name: string | null; role: string; avatar_color: string | null; avatar_image_url: string | null; level: number }
const ROLE_TIERS: { role: string; titleAr: string }[] = [
  { role: 'hr_admin', titleAr: 'HR' },
  { role: 'manager', titleAr: 'Managers' },
  { role: 'employee', titleAr: 'Employees' },
];

function RealOrg() {
  const auth = useAuth();
  const uid = auth?.session?.user.id;
  const [people, setPeople] = useState<RealPerson[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('id,full_name,role,avatar_color,avatar_image_url').eq('status', 'active');
      const list = (data as Omit<RealPerson, 'level'>[]) ?? [];
      const { data: ps } = await supabase.from('player_state').select('user_id,level').in('user_id', list.map((p) => p.id));
      const lv = new Map((ps ?? []).map((r: { user_id: string; level: number }) => [r.user_id, r.level]));
      setPeople(list.map((p) => ({ ...p, level: lv.get(p.id) ?? 1 })));
    })();
  }, []);

  return (
    <div>
      <p className="mb-5 font-body text-sm text-charcoal">
        The real <span className="highlight">POWR</span> team — your position is highlighted in green.
      </p>
      <div className="space-y-3">
        {ROLE_TIERS.map((tier) => {
          const members = people.filter((p) => p.role === tier.role);
          if (!members.length) return null;
          return (
            <div key={tier.role} className="rounded-lg border border-warm-gray bg-white p-3">
              <p className="mb-2 font-ui text-xs font-bold text-charcoal">{tier.titleAr} <span className="num text-muted">({members.length})</span></p>
              <div className="flex flex-wrap items-start gap-4">
                {members.map((m) => {
                  const isMe = m.id === uid;
                  return (
                    <div key={m.id} className="flex w-16 flex-col items-center gap-1 text-center">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full font-display text-lg font-black text-white" style={{ background: m.avatar_color ?? '#00c17a', boxShadow: isMe ? '0 0 0 3px var(--color-green)' : undefined }}>
                        {m.avatar_image_url ? <img src={m.avatar_image_url} alt="" className="h-full w-full object-cover" /> : (m.full_name ?? '?').charAt(0)}
                      </div>
                      <span className={`font-ui text-[11px] leading-tight ${isMe ? 'font-bold text-green' : 'text-charcoal'}`}>{m.full_name}{isMe ? ' (You)' : ''}</span>
                      <span className="num font-ui text-[10px] text-muted">L<NumberText value={m.level} /></span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
          title="Generate AI image"
          className="absolute -bottom-1 -start-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-white shadow-card transition hover:bg-charcoal"
        >
          <Camera size={11} />
        </button>
      )}
    </div>
  );
}

export default function OrgHierarchy() {
  if (hasSupabase) return <RealOrg />;
  return <StaticOrg />;
}

function StaticOrg() {
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
    if (r.needsKey) setMsg('Generation works in the production environment once the OPENAI_API_KEY is added.');
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
        This is the <span className="highlight">POWR</span> team. The more you advance, the higher you climb in the Org Chart and the closer you get to leadership.
        Your position is highlighted in green — and you can generate AI images of your colleagues using the <Camera size={12} className="inline" /> button.
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
                  Level <NumberText value={tier.level} />
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
                    <span className="font-ui text-[11px] font-bold leading-tight text-green">{player.nameAr} (You)</span>
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
          style={{ background: 'rgba(247,244,238,0.97)' }}
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-float">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-black text-black">Generate image for {gen.name}</h3>
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
                  <span className="font-ui text-xs font-bold">Choose colleague's photo</span>
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
              {loading ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : <><Sparkles size={16} /> Generate image</>}
            </button>
            {msg && <p className="mt-3 rounded-lg bg-yellow-pale p-2 font-ui text-[11px] text-charcoal" style={{ background: 'var(--color-yellow-pale)' }}>{msg}</p>}
          </div>
        </motion.div>
      )}
    </div>
  );
}
