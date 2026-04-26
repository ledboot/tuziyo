import type { Context } from "hono";
import { v4 as uuidv4 } from "uuid";
import { IMAGE_MODEL_IDS, type Env, type IMAGE_MODEL_ID } from "../types";
import { deductCredits } from "./credits";

export interface GenerateInput {
  prompt?: string;
  model?: string;
  provider?: string;
  size?: string;
  quality?: string;
  style?: string;
  aspect_ratio?: string;
  resolution?: string;
  output_format?: string;
  num_images?: number;
  negative_prompt?: string;
  sessionId?: string;
}

export function buildAiInput(input: GenerateInput) {
  const aiInput: Record<string, unknown> = { prompt: input.prompt };
  if (input.size) aiInput.size = input.size;
  if (input.quality) aiInput.quality = input.quality;
  if (input.style) aiInput.style = input.style;
  if (input.aspect_ratio) aiInput.aspect_ratio = input.aspect_ratio;
  if (input.resolution) aiInput.resolution = input.resolution;
  if (input.output_format) aiInput.output_format = input.output_format;
  if (input.num_images) aiInput.num_images = input.num_images;
  if (input.negative_prompt) aiInput.negative_prompt = input.negative_prompt;
  return aiInput;
}

export function generateR2Key(extension?: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const timestamp = now.getTime();
  return `${year}/${month}${day}/${timestamp}.${extension || "png"}`;
}

export async function handleGenerate(c: Context<{ Bindings: Env }>) {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const input = await c.req.json<GenerateInput>();

  if (!input.prompt) {
    return c.json({ error: "prompt is required" }, 400);
  }

  if (!input.model || !IMAGE_MODEL_IDS.includes(input.model as IMAGE_MODEL_ID)) {
    return c.json(
      { error: `model must be one of: ${IMAGE_MODEL_IDS.join(", ")}` },
      400,
    );
  }

  const now = Math.floor(Date.now() / 1000);

  if (input.sessionId) {
    const session = await c.env.DB
      .prepare("SELECT * FROM sessions WHERE id = ? AND user_id = ?")
      .bind(input.sessionId, user.userId)
      .first();

    if (session) {
      const sessionTitle = (session as { title: string }).title;
      if (sessionTitle === "New Chat" || sessionTitle === "New Session") {
        const title = input.prompt.slice(0, 20).trim() || "New Chat";
        await c.env.DB
          .prepare("UPDATE sessions SET title = ?, updated_at = ? WHERE id = ?")
          .bind(title, now, input.sessionId)
          .run();
      }

      const messageId = uuidv4();
      await c.env.DB
        .prepare(
          `
          INSERT INTO messages (id, session_id, role, provider, model, prompt, aspect_ratio, resolution, size, quality, style, negative_prompt, output_format, num_images, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        )
        .bind(messageId, input.sessionId, "user", input.provider, input.model, input.prompt, input.aspect_ratio, input.resolution, input.size, input.quality, input.style, input.negative_prompt, input.output_format, input.num_images, now)
        .run();

      await c.env.DB
        .prepare("UPDATE sessions SET updated_at = ? WHERE id = ?")
        .bind(now, input.sessionId)
        .run();
    }
  }

  // Commented out AI generation and credit deduction
  /*
  const deductResult = await deductCredits(c.env.DB, user.userId, 0, input.model);
  if (!deductResult.success) {
    return c.json({ error: deductResult.error }, 402);
  }

  const aiInput = buildAiInput(input);
  const result = (await c.env.AI.run(input.model, aiInput, {
    gateway: { id: "image-ai-gateway" },
  })) as { image?: string; url?: string };

  const imageUrl = result.url || result.image;
  if (!imageUrl) {
    return c.json({ error: "no image returned from AI" }, 500);
  }

  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();

  const key = generateR2Key(input.output_format);
  await c.env.IMAGES.put(key, imageBuffer);

  return c.json({ key });
  */

  return c.json({ success: true, message: "Generation skipped (AI disabled)" });
}

export function getModels() {
  return [
    { id: 'google/nano-banana-2', name: 'Nano Banana 2', provider: 'Google', icon: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/google.svg', supportsImage: true, isNew: false },
    { id: 'alibaba/wan-2.6-image', name: 'WAN 2.6', provider: 'Alibaba', icon: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/alibaba.svg', supportsImage: false, isNew: false },
    { id: 'bytedance/seedream-5-lite', name: 'Seedream 5', provider: 'ByteDance', icon: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/bytedance.svg', supportsImage: true, isNew: false },
    { id: 'openai/gpt-image-1.5', name: 'GPT Image 1.5', provider: 'OpenAI', icon: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/openai.svg', supportsImage: false, isNew: true },
  ];
}
