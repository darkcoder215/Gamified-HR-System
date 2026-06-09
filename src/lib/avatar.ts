// Shared helpers for the AI photo→pixel-avatar feature (player + colleagues).

// Downscale an uploaded photo to keep the upload payload small.
export function fileToScaledDataURL(file: File, max = 512): Promise<string> {
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

export interface GenResult {
  image?: string;
  needsKey?: boolean;
  error?: string;
}

// Calls the Vercel serverless function (active in production with OPENAI_API_KEY).
export async function generatePixelAvatar(imageBase64: string): Promise<GenResult> {
  try {
    const res = await fetch('/api/generate-character', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 501) return { needsKey: true };
    if (!res.ok || !data.image) return { error: data.message || 'تعذّر توليد الصورة، حاول مرة أخرى.' };
    return { image: data.image as string };
  } catch {
    return { error: 'تعذّر الاتصال بخدمة التوليد.' };
  }
}
