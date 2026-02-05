<p align="center">
  <img src="screenshots/onboarding.png" alt="OpenPrismer" width="600" />
</p>

<h1 align="center">OpenPrismer Docker</h1>

<p align="center">
  <strong>Self-hosted AI-powered Academic Research Platform</strong>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> ·
  <a href="#-features">Features</a> ·
  <a href="#-configuration">Configuration</a> ·
  <a href="#-api-reference">API Reference</a>
</p>

<p align="center">
  <a href="https://github.com/Prismer-AI/Prismer/stargazers"><img src="https://img.shields.io/github/stars/Prismer-AI/Prismer?color=ffcb47&labelColor=black&style=flat-square" alt="Stars"></a>
  <a href="https://github.com/Prismer-AI/Prismer/blob/main/LICENSE.md"><img src="https://img.shields.io/badge/license-MIT-blue?labelColor=black&style=flat-square" alt="License"></a>
  <a href="https://discord.gg/VP2HQHbHGn"><img src="https://img.shields.io/badge/Discord-Join-5865F2?style=flat-square&logo=discord&logoColor=white&labelColor=black" alt="Discord"></a>
  <a href="https://x.com/PrismerAI"><img src="https://img.shields.io/twitter/follow/PrismerAI?style=flat-square&logo=x&labelColor=black" alt="X (Twitter)"></a>
  <a href="https://www.linkedin.com/company/prismer-ai"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn"></a>
</p>

<p align="center">
  <a href="./README.md"><img alt="English" src="https://img.shields.io/badge/English-d9d9d9"></a>
  <a href="../docs/i18n/README-docker.zh-CN.md"><img alt="简体中文" src="https://img.shields.io/badge/简体中文-d9d9d9"></a>
  <a href="../docs/i18n/README-docker.ja.md"><img alt="日本語" src="https://img.shields.io/badge/日本語-d9d9d9"></a>
  <a href="../docs/i18n/README-docker.fr.md"><img alt="Français" src="https://img.shields.io/badge/Français-d9d9d9"></a>
  <a href="../docs/i18n/README-docker.de.md"><img alt="Deutsch" src="https://img.shields.io/badge/Deutsch-d9d9d9"></a>
</p>

---

## Overview

OpenPrismer is a **fully containerized academic research environment** that brings together:

- **AI Chat** with multi-provider support (Google, Anthropic, OpenAI, Venice, OpenRouter)
- **Python/Jupyter** for data analysis and visualization
- **LaTeX/TeX Live** for paper compilation
- **Coq/Z3** for formal verification

All services run in a single Docker container with a beautiful web UI.

---

## 🚀 Quick Start

### 1. Pull and Run

```bash
docker run -d \
  --name openprismer \
  -p 3000:3000 \
  -v openprismer-data:/workspace \
  ghcr.io/prismer-ai/openprismer:latest
```

### 2. Open Browser

Navigate to **http://localhost:3000**

### 3. Configure AI Provider

On first launch, select your AI provider and enter your API key:

| Provider | Models | Notes |
|----------|--------|-------|
| **Google AI** | Gemini 2.5 Flash/Pro | Recommended for speed |
| **Anthropic** | Claude Opus 4.5, Sonnet | Best for complex reasoning |
| **OpenAI** | GPT-4o, o1 | ChatGPT models |
| **Venice AI** | Claude, Llama (anonymized) | Privacy-focused |
| **OpenRouter** | 100+ models | Unified API |

Your API key is stored locally and never sent to our servers.

---

## ✨ Features

### AI Research Assistant

Chat with an AI agent that can:
- Search academic papers (arXiv, Semantic Scholar)
- Execute Python code for data analysis
- Generate visualizations with matplotlib/seaborn
- Compile LaTeX documents to PDF
- Verify proofs with Coq/Z3

<p align="center">
  <img src="screenshots/jupyter.png" alt="Jupyter Visualization" width="700" />
</p>

### LaTeX Editor with PDF Preview

Write LaTeX with real-time compilation using the container's TeX Live installation:
- **pdflatex**, **xelatex**, **lualatex** engines
- IEEE, ACM, Nature templates
- Instant PDF preview

<p align="center">
  <img src="screenshots/latex.png" alt="LaTeX Editor" width="700" />
</p>

### Jupyter Notebooks

Full scientific Python stack pre-installed:
- numpy, scipy, pandas, polars
- matplotlib, seaborn, plotly
- scikit-learn, pytorch, transformers
- sympy for symbolic math

### Formal Verification

- **Coq** proof assistant
- **Z3** SMT solver

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FRONTEND_PORT` | `3000` | Web UI port |
| `LATEX_PORT` | `8080` | LaTeX server (internal) |
| `PROVER_PORT` | `8081` | Prover server (internal) |
| `JUPYTER_PORT` | `8888` | Jupyter server (internal) |
| `GATEWAY_PORT` | `18900` | Agent gateway (internal) |

### Volume Mounts

| Path | Description |
|------|-------------|
| `/workspace/projects` | Your project files |
| `/workspace/notebooks` | Jupyter notebooks |
| `/workspace/output` | Generated artifacts (PDFs, images) |

### Docker Compose

```yaml
version: '3.8'

services:
  openprismer:
    image: ghcr.io/prismer-ai/openprismer:latest
    ports:
      - "3000:3000"
    volumes:
      - openprismer-data:/workspace
    restart: unless-stopped

volumes:
  openprismer-data:
```

---

## 🔨 Build from Source

```bash
# Clone
git clone https://github.com/Prismer-AI/Prismer.git
cd Prismer/docker

# Build
docker build -t openprismer .

# Run
docker run -d --name openprismer -p 3000:3000 -v openprismer-data:/workspace openprismer
```

---

## 📡 API Reference

### Chat API

```bash
POST /api/v1/chat
Content-Type: application/json

{
  "session_id": "optional-session-id",
  "content": "Plot a sine wave",
  "stream": true,
  "config": {
    "provider": "google",
    "model": "gemini-2.5-flash",
    "api_key": "your-api-key"
  }
}
```

### LaTeX Compilation

```bash
POST /api/v1/services/latex
Content-Type: application/json

{
  "source_content": "\\documentclass{article}\\begin{document}Hello\\end{document}",
  "engine": "pdflatex"
}
```

### Files API

```bash
# List directory
GET /api/v1/files?path=/projects

# Get file content
GET /api/v1/files?path=/output/document.pdf

# Upload file
POST /api/v1/files
Content-Type: multipart/form-data
```

### Artifacts API

```bash
# List generated artifacts
GET /api/v1/artifacts

# Delete artifact
DELETE /api/v1/artifacts?path=/output/old.pdf
```

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Browser (:3000)                            │
├──────────────────────────────────────────────────────────────┤
│                 Next.js 15 Frontend                           │
│              React 19 + Tailwind CSS 4                        │
├───────────┬───────────┬───────────┬───────────┬──────────────┤
│  LaTeX    │  Prover   │  Jupyter  │  OpenClaw │    Files     │
│  :8080    │  :8081    │  :8888    │  :18900   │    API       │
├───────────┴───────────┴───────────┴───────────┴──────────────┤
│              Academic Base Image                              │
│     Python 3.12 | TeX Live | Coq | Z3 | Node.js 22           │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### Container won't start

```bash
# Check logs
docker logs openprismer

# Verify ports are available
lsof -i :3000
```

### LaTeX compilation fails

Ensure you're using one of the supported engines:
- `pdflatex` (default)
- `xelatex` (for Unicode/fonts)
- `lualatex` (for Lua scripting)

### Python packages missing

The container includes a full scientific stack. To add more:

```bash
docker exec -it openprismer pip install package-name
```

---

## 📄 License

MIT License - See [LICENSE](../LICENSE.md)

---

<p align="center">
  <sub>Built for researchers, by researchers.</sub>
</p>
