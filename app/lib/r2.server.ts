import type { R2Bucket } from "@cloudflare/workers-types";

export async function uploadImageToR2(
  r2: R2Bucket,
  file: File,
  userId: string,
): Promise<string> {
  const extension = file.name.split(".").pop() || "unknown";
  const uniqueId = crypto.randomUUID();
  const objectKey = `uploads/users/${userId}/${uniqueId}.${extension}`;

  await r2.put(objectKey, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type,
    },
  });

  // Note: For this to work as a public URL, your R2 bucket must be connected
  // to a custom domain or use an R2.dev domain.
  // In a real application, you construct the public URL from your domain.
  // Replace this with your actual public R2 bucket domain when deploying.
  return `/${objectKey}`;
}

export async function uploadBase64ToR2(
  r2: R2Bucket,
  base64Data: string,
  mimeType: string,
  userId: string,
): Promise<string> {
  const uniqueId = crypto.randomUUID();
  const extension = mimeType.split("/")[1] || "png";
  const objectKey = `generated/${userId}/${uniqueId}.${extension}`;

  // Extract base64 without prefix data:image/png;base64,...
  const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
  const nodeBuffer = Buffer.from(base64Content, "base64");

  // Extract a clean ArrayBuffer to prevent Miniflare `AssertionError: false == true`
  // when trying to serialize Node's shared Buffer pool across the proxy boundary.
  const arrayBuffer = nodeBuffer.buffer.slice(
    nodeBuffer.byteOffset,
    nodeBuffer.byteOffset + nodeBuffer.byteLength,
  );

  await r2.put(objectKey, arrayBuffer, {
    httpMetadata: {
      contentType: mimeType,
    },
  });

  return `/${objectKey}`;
}
