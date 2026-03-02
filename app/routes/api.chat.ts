import type { ActionFunctionArgs } from "react-router";
import { requireUser } from "../lib/auth.server";
import { addMessage } from "../lib/db";
import { generateImage } from "../lib/nano-banana.server";
import { v4 as uuidv4 } from "uuid";

export async function action({ request, context }: ActionFunctionArgs) {
  const user = await requireUser(request, context);
  const formData = await request.formData();

  const prompt = formData.get("prompt") as string;
  const sessionId = formData.get("sessionId") as string;
  const model = formData.get("model") as string | undefined;
  const aspectRatio = formData.get("aspectRatio") as string;
  const resolution = formData.get("resolution") as "1K" | "2K" | "4K";
  const enableSearchStr = formData.get("enableSearch") as string;
  const enableSearch = enableSearchStr === "true";

  const imagesStr = formData.get("images") as string | null;
  const images: Array<{ base64: string; mimeType: string }> = imagesStr
    ? JSON.parse(imagesStr)
    : [];

  if (!sessionId) {
    return Response.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const env = context.cloudflare.env as any;
  const db = env.DB;
  const r2 = env.R2;

  let attachmentUrls: string[] = [];

  // 1. Process user's attachments if present
  if (images.length > 0) {
    attachmentUrls = images.map((img) => img.base64);
  }

  // 2. Save User Message to D1
  const userMessageId = uuidv4();
  await addMessage(db, {
    id: userMessageId,
    session_id: sessionId,
    role: "user",
    content: prompt,
    image_url:
      attachmentUrls.length > 0 ? JSON.stringify(attachmentUrls) : null,
    aspect_ratio: aspectRatio,
    resolution: resolution,
    enable_search: enableSearch ? 1 : 0,
  });

  // 3. Call Gemini (Nano Banana API)
  const result = await generateImage(
    {
      prompt,
      model: model as any,
      aspect_ratio: aspectRatio,
      resolution: resolution,
      enable_search: enableSearch,
      images,
    },
    context,
  );

  // 4. Handle result and save Assistant message
  if (result.error) {
    await addMessage(db, {
      id: uuidv4(),
      session_id: sessionId,
      role: "assistant",
      content: `Error generating image: ${result.error}`,
      image_url: null,
      aspect_ratio: null,
      resolution: null,
      enable_search: 0,
    });
    return Response.json({ error: result.error }, { status: 500 });
  }

  // 5. Store generated image directly as Base64 in DB
  if (result.imageBase64 && result.mimeType) {
    const generatedImageUrl = `data:${result.mimeType};base64,${result.imageBase64}`;

    const assistantMsg = await addMessage(db, {
      id: uuidv4(),
      session_id: sessionId,
      role: "assistant",
      content: null,
      image_url: generatedImageUrl,
      aspect_ratio: null,
      resolution: null,
      enable_search: 0,
    });

    return Response.json({ success: true, message: assistantMsg });
  }

  return Response.json({ error: "Unknown error occurred" }, { status: 500 });
}
