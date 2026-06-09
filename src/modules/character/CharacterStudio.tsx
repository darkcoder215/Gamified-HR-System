import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Sparkles, Trash2, Loader2, Palette, Wand2 } from 'lucide-react';
import { useGameStore } from '@/state/store';
import Button from '@/ui/Button';

type Tab = 'ai' | 'color';

const TINTS: { label: string; hex: string | null }[] = [
  { label: 'الأصلي', hex: null },
  { label: 'أخضر', hex: '#00c17a' },
  { label: 'أزرق', hex: '#0072f9' },
  { label: 'كهرماني', hex: '#ffbc0a' },
  { label: 'وردي', hex: '#ff00b7' },
  { label: 'سماوي', hex: '#84dbe5' },
  { label: 'عنّابي', hex: '#82003a' },
];

// Downscale an uploaded photo to keep the upload payload small.
function fileToScaledDataURL(file: File, max = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      c.getContext('2d')!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function CharacterStudio() {
  const player = useGameStore((s) => s.player);
  const setAvatarImage = useGameStore((s) => s.setAvatarImage);
  const setCharacterTint = useGameStore((s) => s.setCharacterTint);

  const [tab, setTab] = useState<Tab>('ai');
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = async (file?: File) => {
    if (!file) return;
    setError(null);
    setPhoto(await fileToScaledDataURL(file));
  };

  const generate = async () => {
    if (!photo) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/generate-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: photo }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 501) {
        setError(
          'ميزة التوليد بالذكاء الاصطناعي تُفعَّل في بيئة الإنتاج بعد إضافة مفتاح OPENAI_API_KEY. يمكنك الآن اختيار لون الشخصية من تبويب «الألوان».'
        );
      } else if (!res.ok || !data.image) {
        setError(data.message || 'تعذّر توليد الشخصية، حاول مرة أخرى.');
      } else {
        setAvatarImage(data.image);
      }
    } catch {
      setError('تعذّر الاتصال بخدمة التوليد.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* current avatar preview */}
      <div className="mb-5 flex items-center gap-4 rounded-lg bg-white p-4 shadow-soft">
        <div
          className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg font-display text-3xl font-black text-white"
          style={{ background: player.avatar }}
        >
          {player.avatarImage ? (
            <img src={player.avatarImage} alt="الشخصية" className="h-full w-full object-cover" style={{ imageRendering: 'pixelated' }} />
          ) : (
            player.nameAr.trim().charAt(0) || '؟'
          )}
        </div>
        <div className="flex-1">
          <p className="font-display text-lg font-black text-black">{player.nameAr}</p>
          <p className="font-ui text-sm text-muted">{player.titleAr}</p>
        </div>
        {player.avatarImage && (
          <button
            onClick={() => setAvatarImage(null)}
            className="flex items-center gap-1 rounded-pill px-3 py-1.5 font-ui text-xs font-bold text-red transition hover:bg-warm-gray"
          >
            <Trash2 size={14} /> إزالة
          </button>
        )}
      </div>

      {/* tabs */}
      <div className="mb-5 flex gap-2 rounded-pill bg-warm-gray p-1">
        {([['ai', 'توليد بالذكاء الاصطناعي', Wand2], ['color', 'ألوان الشخصية', Palette]] as const).map(
          ([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="relative flex flex-1 items-center justify-center gap-2 rounded-pill px-3 py-2 font-ui text-sm font-bold transition"
              style={{ color: tab === id ? '#fff' : 'var(--color-muted)' }}
            >
              {tab === id && <motion.div layoutId="cs-tab" className="absolute inset-0 rounded-pill bg-black" />}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon size={15} /> {label}
              </span>
            </button>
          )
        )}
      </div>

      {tab === 'ai' && (
        <div>
          <p className="mb-4 font-body text-sm text-charcoal">
            ارفع صورتك وسيحوّلها الذكاء الاصطناعي إلى شخصية بكسلية بأسلوب اللعبة — تمامًا كما في الدليل.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-warm-gray bg-white text-muted transition hover:border-green"
            >
              {photo ? (
                <img src={photo} alt="صورتك" className="h-full w-full rounded-lg object-cover" />
              ) : (
                <>
                  <Upload size={28} />
                  <span className="font-ui text-xs font-bold">اختر صورة</span>
                </>
              )}
            </button>
            <div className="flex flex-col justify-center gap-3">
              <Button variant="accent" onClick={generate} disabled={!photo || loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> جارٍ التوليد…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles size={16} /> ولّد الشخصية
                  </span>
                )}
              </Button>
              {photo && (
                <button onClick={() => setPhoto(null)} className="font-ui text-xs text-muted hover:text-red">
                  إزالة الصورة المختارة
                </button>
              )}
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
          />
          {error && (
            <p className="mt-4 rounded-lg bg-yellow-pale p-3 font-ui text-xs text-charcoal" style={{ background: 'var(--color-yellow-pale)' }}>
              {error}
            </p>
          )}
        </div>
      )}

      {tab === 'color' && (
        <div>
          <p className="mb-4 font-body text-sm text-charcoal">اختر لون شخصيتك داخل العالم:</p>
          <div className="flex flex-wrap gap-3">
            {TINTS.map((t) => {
              const active = player.characterTint === t.hex;
              return (
                <button
                  key={t.label}
                  onClick={() => setCharacterTint(t.hex)}
                  className="flex flex-col items-center gap-1"
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full border-4 transition"
                    style={{
                      background: t.hex ?? 'var(--color-warm-gray)',
                      borderColor: active ? 'var(--color-black)' : 'transparent',
                    }}
                  >
                    {!t.hex && <span className="font-ui text-[10px] font-bold text-muted">±</span>}
                  </span>
                  <span className="font-ui text-[11px] text-muted">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
