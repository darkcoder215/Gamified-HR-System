// Vercel serverless function: turns an uploaded photo into a pixel-art RPG
// character avatar using an image-generation model. Activates in production
// once OPENAI_API_KEY is set. Runs on the Node runtime (needs Blob/FormData/fetch).
export const config = { runtime: 'nodejs', maxDuration: 60 };

const PIXEL_PROMPT = `Study the person in the provided photo, then create a high-quality 2D pixel-art RPG character avatar inspired by them, in a clean retro 16-bit JRPG style. Front-facing bust, friendly expression, soft cohesive palette, crisp pixels, plain transparent or solid light background, no text, no logos, no watermark.`;

interface VercelReq {
  method?: string;
  body?: unknown;
}
interface VercelRes {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
}

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return res.status(501).json({
      error: 'NO_KEY',
      message: 'AI character generation is not configured. Set OPENAI_API_KEY in the environment.',
    });
  }

  try {
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as {
      imageBase64?: string;
    };
    const imageBase64 = body?.imageBase64;
    if (!imageBase64) return res.status(400).json({ error: 'NO_IMAGE' });

    const b64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buf = Buffer.from(b64, 'base64');

    const form = new FormData();
    form.append('model', 'gpt-image-1');
    form.append('image', new Blob([buf], { type: 'image/png' }), 'photo.png');
    form.append('prompt', PIXEL_PROMPT);
    form.append('size', '1024x1024');

    const r = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
    const data = (await r.json()) as { data?: { b64_json?: string }[]; error?: unknown };
    if (!r.ok || !data.data?.[0]?.b64_json) {
      return res.status(502).json({ error: 'PROVIDER_ERROR', detail: data.error ?? data });
    }
    return res.status(200).json({ image: `data:image/png;base64,${data.data[0].b64_json}` });
  } catch (e) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: String(e) });
  }
}
