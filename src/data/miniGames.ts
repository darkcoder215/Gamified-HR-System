// Rapid true/false statements for the "quick decision" mini-game (problem-solving).
export interface TFStatement {
  id: string;
  textAr: string;
  answer: boolean; // true = صحيح
}

export const decisionBank: TFStatement[] = [
  { id: 'd1', textAr: 'تعريف المشكلة بدقّة قبل البحث عن حل يوفّر الوقت لاحقًا.', answer: true },
  { id: 'd2', textAr: 'الأفضل دائمًا اختيار أسرع حل دون النظر إلى أثره.', answer: false },
  { id: 'd3', textAr: 'أسلوب «الأسباب الخمسة» يساعد في بلوغ السبب الجذري.', answer: true },
  { id: 'd4', textAr: 'تجاهل البيانات والاعتماد على الحدس وحده قرار حكيم.', answer: false },
  { id: 'd5', textAr: 'موازنة الأثر مقابل الجهد تفيد في ترتيب الأولويات.', answer: true },
  { id: 'd6', textAr: 'إشراك الفريق في الحلول يقلّل من جودة القرار.', answer: false },
  { id: 'd7', textAr: 'تقسيم المشكلة الكبيرة إلى أجزاء أصغر يسهّل حلّها.', answer: true },
  { id: 'd8', textAr: 'اختبار فرضية واحدة فقط دائمًا أفضل من عدّة فرضيات.', answer: false },
  { id: 'd9', textAr: 'توثيق القرار وأسبابه يفيد عند مراجعته مستقبلًا.', answer: true },
  { id: 'd10', textAr: 'تأجيل القرارات الصعبة بلا سبب يحسّن النتائج.', answer: false },
];

export const shuffle = <T,>(a: T[]): T[] => [...a].sort(() => Math.random() - 0.5);
