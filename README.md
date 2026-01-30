<h1 align="center">
  <img src="https://raw.githubusercontent.com/ledboot/tuziyo/main/public/logo.svg" alt="tuziyo" width="200" height="200">
  <br>tuziyo<br>
</h1>

**Professional. Private. Powerful. AI-driven Image Tools in your Browser.**

[![Deploy with Cloudflare Pages](https://img.shields.io/badge/Deploy%20to-Cloudflare%20Pages-F38020?logo=cloudflare-pages&logoColor=white)](https://pages.cloudflare.com/)
[![GitHub license](https://img.shields.io/github/license/ledboot/tuziyo)](https://github.com/ledboot/tuziyo/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/ledboot/tuziyo)](https://github.com/ledboot/tuziyo/stargazers)

Tuziyo is a modern web application providing a suite of professional-grade image editing tools powered by state-of-the-art AI. Designed with **privacy-first** principles, all processing happens locally in your browser using WebGPU and WASM technologies.

[Explore the Tools](https://tuziyo.com)

---

## ✨ Key Features

- 🪄 **AI Inpainting**: Remove unwanted objects or restore missing parts of images with advanced neural networks (MI-GAN).
- 📐 **Expert Resizer**: Batch resize images with precision, supporting both pixel and percentage scaling with aspect ratio locking.
- ✂️ **Precision Crop**: Pixel-perfect cropping with presets for social media (16:9, 4:3, 1:1, etc.).
- 🔄 **Smart Converter**: Instantly convert images between formats (HEIC, PNG, JPG, WebP) with batch support.
- 🔒 **100% Private**: Your images never touch any server. Everything is processed locally on your machine.
- 🔥 **High Performance**: Hardware-accelerated results via WebGPU and highly optimized WASM modules.

---

## 🛠️ Technology Stack

- **Framework**: [React Router v7](https://reactrouter.com/) (Framework Mode with SSR)
- **Runtime**: [Bun](https://bun.sh/)
- **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com/) (SSR via Pages Functions)
- **Styling**: Tailwind CSS 4.0
- **Icons**: Lucide React
- **AI Engine**: ONNX Runtime Web (WebGPU/WASM)
- **Image Processing**: Canvas API, heic2any, JSZip

---

## 🚀 Getting Started

### Prerequisites

You will need [Bun](https://bun.sh/) installed on your machine.

### Installation

```bash
# Clone the repository
git clone https://github.com/ledboot/tuziyo.git

# Navigate to the project directory
cd tuziyo

# Install dependencies
bun install
```

### Development

```bash
# Run the development server
bun dev
```

---

## 📈 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=ledboot/tuziyo&type=Date)](https://star-history.com/#ledboot/tuziyo&Date)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by [ledboot](https://github.com/ledboot)
