import { AwsClient } from "aws4fetch"
import type { Env } from "./types"
import { normalizeContentType } from "./utils"
import { REFERENCE_IMAGE_UPLOAD_EXPIRES_SECONDS } from "./const"


export async function createPresignedReferenceImagePutUrl(
  env: Env,
  key: string,
  contentType: string
) {
  const missingConfig = [
    ["R2_ACCOUNT_ID", env.R2_ACCOUNT_ID],
    ["R2_BUCKET_NAME", env.R2_BUCKET_NAME],
    ["R2_ACCESS_KEY_ID", env.R2_ACCESS_KEY_ID],
    ["R2_SECRET_ACCESS_KEY", env.R2_SECRET_ACCESS_KEY],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name)

  if (missingConfig.length > 0) {
    throw new Error(`Missing R2 signing config: ${missingConfig.join(", ")}`)
  }

  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  })

  const uploadUrl = new URL(
    `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}/${key}`
  )
  uploadUrl.searchParams.set("X-Amz-Expires", String(REFERENCE_IMAGE_UPLOAD_EXPIRES_SECONDS))

  const signedRequest = await client.sign(uploadUrl.toString(), {
    method: "PUT",
    headers: {
      "Content-Type": normalizeContentType(contentType),
    },
    aws: {
      signQuery: true,
      allHeaders: true,
    },
  })

  return signedRequest.url
}


