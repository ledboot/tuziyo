// @ts-expect-error Bun provides this module at test runtime; the app tsconfig intentionally uses Node types.
import { describe, expect, test } from "bun:test"
import {
  getOutputErrorMessage,
  hasOutputError,
  mergeTaskOutputs,
  type GeneratedImageMessage,
  type GeneratedImageOutput,
} from "./generatedImage"

function createOutput(overrides: Partial<GeneratedImageOutput> = {}): GeneratedImageOutput {
  return {
    id: "output-1",
    message_id: "message-1",
    output_index: 0,
    status: "pending",
    thumbnail_url: null,
    display_url: null,
    content_type: "image",
    width: null,
    height: null,
    file_size: null,
    error: null,
    created_at: 1,
    updated_at: 1,
    ...overrides,
  }
}

function createMessage(output: GeneratedImageOutput): GeneratedImageMessage {
  return {
    id: "message-1",
    role: "user",
    provider: null,
    model: "test-model",
    prompt: "A rabbit",
    aspect_ratio: null,
    resolution: null,
    image_size: null,
    quality: null,
    style: null,
    negative_prompt: null,
    output_format: null,
    num_images: 1,
    created_at: 1,
    outputs: [output],
  }
}

describe("generated image output failures", () => {
  test("treats an output error as a failure even before its status is updated", () => {
    const output = createOutput({ error: "Provider rejected the request" })

    expect(hasOutputError(output)).toBe(true)
    expect(getOutputErrorMessage(output)).toBe("Provider rejected the request")
  })

  test("uses a user-facing fallback when a failed output has no error message", () => {
    const output = createOutput({ status: "failed" })

    expect(getOutputErrorMessage(output)).toBe(
      "The image could not be generated. Please try again."
    )
  })

  test("merges polled outputs into their message immediately", () => {
    const pendingOutput = createOutput({ is_favorite: true })
    const failedOutput = createOutput({
      status: "failed",
      error: "The provider did not return this image",
      updated_at: 2,
    })

    const [message] = mergeTaskOutputs([createMessage(pendingOutput)], [failedOutput])

    expect(message.outputs[0]).toMatchObject({
      status: "failed",
      error: "The provider did not return this image",
      updated_at: 2,
      is_favorite: true,
    })
  })
})
