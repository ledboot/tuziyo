<h1 align="center">
  <img src="https://raw.githubusercontent.com/ledboot/tuziyo/main/public/logo.svg" alt="tuziyo" width="200" height="200">
  <br>tuziyo<br>
</h1>

**One creative workspace for AI image generation, model comparison, and browser-based image finishing.**

[![Deploy with Cloudflare Pages](https://img.shields.io/badge/Deploy%20to-Cloudflare-F38020?logo=cloudflare&logoColor=white)](https://www.cloudflare.com/)
[![GitHub license](https://img.shields.io/github/license/ledboot/tuziyo)](https://github.com/ledboot/tuziyo/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/ledboot/tuziyo)](https://github.com/ledboot/tuziyo/stargazers)

Tuziyo is an AI image creation studio that brings multiple leading models into one focused workflow. Generate with models including Nano Banana, Seedream, GPT Image, Grok, and Recraft, then crop, resize, convert, or refine the result without switching between separate tools.

New accounts receive **10 free credits** and do not require a credit card.

[Start creating for free](https://tuziyo.com/ai-toolkit) · [Compare AI image models](https://tuziyo.com/ai/models) · [View pricing](https://tuziyo.com/pricing)

---

## ✨ What you can do

- 🎨 **Multi-model AI generation**: Explore different creative strengths from Nano Banana, Seedream, GPT Image, Grok, Recraft, and other supported models.
- 🖼️ **Reference-guided workflows**: Keep prompts, references, settings, and outputs together in reusable sessions.
- 🔍 **Model comparison guides**: Compare resolution, reference limits, credit cost, controls, and best-fit use cases before generating.
- 🪄 **Local AI inpainting**: Remove unwanted objects or restore missing regions with an in-browser neural model.
- 📐 **Batch image tools**: Resize, crop, and convert HEIC, PNG, JPG, and WebP files directly in the browser.
- 🔒 **Privacy-aware finishing**: The crop, resize, convert, and local inpainting tools process images on the user's device.
- 💳 **Free to try**: Every new account starts with 10 complimentary generation credits.

> Cloud AI generation sends the prompt, selected references, and generation settings to the chosen model provider. The standalone crop, resize, convert, and local inpainting tools run in the browser.

## 🤖 Supported model guides

- [Nano Banana](https://tuziyo.com/ai/models/nano-banana)
- [Nano Banana Pro](https://tuziyo.com/ai/models/nano-banana-pro)
- [Nano Banana 2](https://tuziyo.com/ai/models/nano-banana-2)
- [Seedream 5 Pro](https://tuziyo.com/ai/models/seedream-5-pro)
- [GPT Image 2](https://tuziyo.com/ai/models/gpt-image-2)

## 🛠️ Technology stack

- **Framework**: [React Router v7](https://reactrouter.com/) in framework mode with SSR
- **Runtime**: [Bun](https://bun.sh/)
- **Deployment**: Cloudflare
- **Styling**: Tailwind CSS 4
- **AI Engine**: ONNX Runtime Web for local inpainting
- **Image Processing**: Canvas API, heic2any, and JSZip
- **Backend**: Cloudflare Workers, D1, and R2

## 🚀 Getting started

### Prerequisites

Install [Bun](https://bun.sh/).

### Installation

```bash
git clone https://github.com/ledboot/tuziyo.git
cd tuziyo
bun install
```

### Development

```bash
bun dev
```

## 🔗 Product links

- Website: [tuziyo.com](https://tuziyo.com)
- AI Studio: [tuziyo.com/ai-toolkit](https://tuziyo.com/ai-toolkit)
- Model comparison: [tuziyo.com/ai/models](https://tuziyo.com/ai/models)
- Blog: [tuziyo.com/blog](https://tuziyo.com/blog/)
- Privacy policy: [tuziyo.com/privacy](https://tuziyo.com/privacy)

## 📈 Star history

[![Star History Chart](https://api.star-history.com/svg?repos=ledboot/tuziyo&type=Date)](https://star-history.com/#ledboot/tuziyo&Date)

## 📄 License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE).

---

Built with ❤️ by [ledboot](https://github.com/ledboot)
