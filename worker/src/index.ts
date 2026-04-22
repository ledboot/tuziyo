import { Hono } from 'hono';
import { cors } from 'hono/cors';

interface Env {
  AI: Ai;
  IMAGES: R2Bucket;
}

const IMAGE_MODELS = ['google/nano-banana-2', 'alibaba/wan-2.6-image', 'bytedance/seedream-5-lite', 'openai/gpt-image-1.5'] as const;

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

app.post('/generate', async (c) => {
  const { prompt, model } = await c.req.json<{
    prompt?: string;
    model?: string;
  }>();

  if (!prompt) {
    return c.json({ error: 'prompt is required' }, 400);
  }

  if (!model || !IMAGE_MODELS.includes(model as typeof IMAGE_MODELS[number])) {
    return c.json({ error: `model must be one of: ${IMAGE_MODELS.join(', ')}` }, 400);
  }

  const result = await c.env.AI.run(model, { prompt }, { gateway: { id: 'image-ai-gateway' } }) as { image?: string; url?: string };

  const imageUrl = result.url || result.image;
  if (!imageUrl) {
    return c.json({ error: 'no image returned from AI' }, 500);
  }

  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = now.getTime();
  const key = `${year}/${month}${day}/${timestamp}.png`;

  await c.env.IMAGES.put(key, imageBuffer);

  return c.json({ key });
});

app.get('/models', (c) => {
  return c.json({
    models: [
      { id: 'google/nano-banana-2', name: 'Google Nano Banana 2' },
      { id: 'alibaba/wan-2.6-image', name: 'Alibaba Wan 2.6 Image' },
      { id: 'bytedance/seedream-5-lite', name: 'ByteDance Seedream 5 Lite' },
      { id: 'openai/gpt-image-1.5', name: 'OpenAI GPT Image 1.5' },
    ],
  });
});

export default {
  fetch: app.fetch,
};