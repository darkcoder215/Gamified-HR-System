import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Gamepad2, ArrowDownLeft, Sparkles, PlayCircle } from 'lucide-react';
import { buildingGuides } from '@/data/guide';
import { useGameStore } from '@/state/store';

type Tab = 'buildings' | 'howto';

export default function GuideModal() {
  const [tab, setTab] = useState<Tab>('buildings');
  const replayIntro = useGameStore((s) => s.replayIntro);
  const closeGuide = useGameStore((s) => s.closeGuide);

  return (
    <div>
      <div className="mb-5 flex gap-2 rounded-pill bg-warm-gray p-1">
        {([['buildings', 'المباني', Building2], ['howto', 'طريقة اللعب', Gamepad2]] as const).map(
          ([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="relative flex flex-1 items-center justify-center gap-2 rounded-pill px-3 py-2 font-ui text-sm font-bold transition"
              style={{ color: tab === id ? '#fff' : 'var(--color-muted)' }}
            >
              {tab === id && <motion.div layoutId="guide-tab" className="absolute inset-0 rounded-pill bg-black" />}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon size={15} /> {label}
              </span>
            </button>
          )
        )}
      </div>

      {tab === 'buildings' && (
        <div className="space-y-3">
          <p className="font-body text-sm text-charcoal">
            تجوّل في عالم <span className="highlight">ثمانية</span> وزُر المباني الخمسة — لكل مبنى دور يساعدك على
            التطوّر والترقية:
          </p>
          {buildingGuides.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex gap-3 rounded-lg bg-white p-4 shadow-soft"
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-2xl"
                style={{ background: b.color, color: '#fff' }}
              >
                {b.glyph}
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-black text-black">{b.nameAr}</h3>
                <p className="mt-0.5 font-ui text-[13px] leading-relaxed text-charcoal">{b.whatAr}</p>
                <p className="mt-1.5 flex items-start gap-1.5 font-ui text-[13px] font-bold leading-relaxed text-green">
                  <Sparkles size={14} className="mt-0.5 shrink-0" />
                  {b.benefitAr}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'howto' && (
        <div className="space-y-4">
          <div className="rounded-lg bg-white p-4 shadow-soft">
            <h3 className="mb-2 font-display text-lg font-black text-black">الهدف</h3>
            <p className="font-body text-sm leading-relaxed text-charcoal">
              طوّر مهاراتك عبر التقييمات والمهام، اجمع الخبرة لرفع مستواك، واستوفِ متطلبات كل رتبة لتتسلّق
              <span className="highlight">سلّم الترقيات</span> حتى القيادة.
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-soft">
            <h3 className="mb-3 font-display text-lg font-black text-black">التحكّم</h3>
            <ul className="space-y-2 font-ui text-sm text-charcoal">
              <li className="flex items-center gap-2">
                <span className="rounded-md bg-warm-gray px-2 py-1 font-bold"><span className="num">WASD</span></span>
                أو مفاتيح الأسهم للتحرّك في العالم
              </li>
              <li className="flex items-center gap-2">
                <span className="rounded-md bg-warm-gray px-2 py-1 font-bold"><span className="num">E</span></span>
                للدخول إلى المبنى عند الاقتراب منه
              </li>
              <li className="flex items-center gap-2">
                <span className="rounded-md bg-warm-gray px-2 py-1"><ArrowDownLeft size={15} /></span>
                على الجوال: استخدم عصا التحكّم وزر التفاعل
              </li>
            </ul>
          </div>
          <div className="rounded-lg p-4" style={{ background: 'var(--color-green-light)' }}>
            <p className="font-ui text-sm font-bold text-black">
              💡 تابع «دليل البداية» أسفل الشاشة لإكمال خطواتك الأولى، وافتح «تحليلاتي» لمعرفة أين تقف وما خطوتك التالية.
            </p>
          </div>
          <button
            onClick={() => {
              closeGuide();
              replayIntro();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-pill bg-black py-3 font-ui text-sm font-bold text-white transition hover:opacity-90"
          >
            <PlayCircle size={16} /> شاهد المقدّمة من جديد
          </button>
        </div>
      )}
    </div>
  );
}
