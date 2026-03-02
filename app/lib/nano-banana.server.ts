import type { AppLoadContext } from "react-router";

export interface GenerationParams {
  prompt: string;
  model?:
    | "gemini-2.5-flash-image"
    | "gemini-3.1-flash-image-preview"
    | "gemini-3-pro-image-preview";
  aspect_ratio?: string;
  resolution?: "1K" | "2K" | "4K";
  enable_search?: boolean;
  images?: Array<{ base64: string; mimeType: string }>;
}

export interface GenerationResult {
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
  error?: string;
}

export async function generateImage(
  params: GenerationParams,
  context: AppLoadContext,
): Promise<GenerationResult> {
  const env = (context as any).cloudflare?.env;
  const apiKey = env.NANO_BANANA_API_KEY;

  if (!apiKey) {
    return { error: "NANO_BANANA_API_KEY is not configured" };
  }

  const model = params.model || "gemini-2.5-flash-image";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Construct Gemini API payload
  let parts: any[] = [{ text: params.prompt }];

  if (params.images && params.images.length > 0) {
    // Gemini vision accepts multiple inlineData parts before the text
    const imageParts = params.images.map((img) => {
      const b64Data = img.base64.includes(",")
        ? img.base64.split(",")[1]
        : img.base64;

      return {
        inlineData: {
          mimeType: img.mimeType,
          data: b64Data,
        },
      };
    });
    parts.unshift(...imageParts);
  }

  const imageConfig: any = {};
  if (params.aspect_ratio) imageConfig.aspectRatio = params.aspect_ratio;
  // Gemini 2.5 doesn't support imageSize, but since the API accepts it or ignores it, we pass it.
  // We'll restrict imageSize to v3 models if needed, but safe to pass if the user selects it.
  if (params.resolution && model.includes("gemini-3")) {
    imageConfig.imageSize = params.resolution;
  }

  const payload: any = {
    contents: [
      {
        parts: parts,
      },
    ],
    generationConfig: {
      responseModalities: ["IMAGE"],
      ...(Object.keys(imageConfig).length > 0 ? { imageConfig } : {}),
    },
  };

  // Add search grounding tool if requested
  if (params.enable_search) {
    payload.tools = [{ googleSearch: {} }];
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      return {
        error: `Gemini API Error: ${response.status} ${response.statusText}`,
      };
    }

    const data = (await response.json()) as any;

    // Parse the response based on Gemini Image output structure
    // Typically, the image is returned in response.candidates[0].content.parts[0].inlineData
    const candidate = data?.candidates?.[0];
    if (!candidate) {
      return { error: "No candidates returned from Gemini API" };
    }

    const parts = candidate.content?.parts || [];
    const imagePart = parts.find((p: any) => p.inlineData);

    if (imagePart && imagePart.inlineData) {
      return {
        imageBase64: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType || "image/png",
      };
    }

    return { error: "No image found in the response" };
  } catch (error) {
    console.error("Failed to generate image:", error);
    return { error: "Internal server error during generation" };
  }
}
