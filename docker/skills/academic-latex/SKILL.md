---
name: academic-latex
description: Compile LaTeX documents to PDF using the container's TeX Live installation. Supports pdflatex, xelatex, and lualatex engines.
metadata:
  openclaw:
    emoji: "📄"
    os: ["linux"]
    category: academic
---

# Academic LaTeX — Compile LaTeX to PDF

## Overview

This skill lets you compile LaTeX documents into PDFs using the container's full
TeX Live 2023 installation. Three engines are available: `pdflatex` (fastest),
`xelatex` (Unicode/system fonts), and `lualatex` (Lua scripting).

## When To Use

- User asks to compile LaTeX, create a PDF, or typeset a document
- User provides `.tex` content or asks you to write LaTeX
- User needs academic paper templates (IEEE, ACM, article, beamer)

## Compile via REST API

The LaTeX server runs at `http://localhost:8080`.

### Basic compile

```bash
# Write LaTeX to a file
cat > /tmp/doc.tex << 'TEX'
\documentclass{article}
\begin{document}
Hello, world!
\end{document}
TEX

# Compile via API — output is raw PDF bytes
curl -sf -X POST http://localhost:8080/compile \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg tex "$(cat /tmp/doc.tex)" '{content: $tex, engine: "pdflatex"}')" \
  -o /workspace/output/document.pdf
```

### Engine selection

| Engine | Use when |
|--------|----------|
| `pdflatex` | Default. Fast. Standard ASCII/Latin documents. |
| `xelatex` | Unicode text, system fonts, CJK characters. |
| `lualatex` | Lua scripting, advanced typography. |

```bash
# Chinese document — use xelatex
curl -sf -X POST http://localhost:8080/compile \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg tex "$(cat /tmp/doc.tex)" '{content: $tex, engine: "xelatex"}')" \
  -o /workspace/output/document.pdf
```

### Quick preview (lower quality, faster)

```bash
curl -sf -X POST http://localhost:8080/preview \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg tex "$(cat /tmp/doc.tex)" '{content: $tex}')" \
  -o /workspace/output/preview.pdf
```

### List available templates

```bash
curl -sf http://localhost:8080/templates | jq .
# → {"templates": ["article", "article-zh", "beamer", "ieee"], "engines": [...]}
```

### Health check

```bash
curl -sf http://localhost:8080/health | jq .
```

## Compile via CLI (alternative)

For multi-file projects or BibTeX workflows, use CLI directly:

```bash
cd /workspace/projects/my-paper
pdflatex -interaction=nonstopmode main.tex
bibtex main
pdflatex -interaction=nonstopmode main.tex
pdflatex -interaction=nonstopmode main.tex
cp main.pdf /workspace/output/
```

## API Reference

| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/compile` | POST | `{"content": "<tex>", "engine": "pdflatex\|xelatex\|lualatex"}` | PDF binary (200) or error JSON (4xx) |
| `/preview` | POST | `{"content": "<tex>"}` | PDF binary |
| `/templates` | GET | — | JSON list of templates and engines |
| `/health` | GET | — | JSON health status |

## Error Handling

- HTTP 400+: compilation failed. Response body is JSON with `error` and `log` fields.
- Read the LaTeX log to identify missing packages or syntax errors.
- All standard TeX Live packages are pre-installed.
- For missing packages, check: `kpsewhich <package>.sty`

## Workflow

1. Write `.tex` content (inline or from user input)
2. Save to `/tmp/` or `/workspace/projects/<name>/`
3. Compile via API or CLI
4. Save PDF to `/workspace/output/`
5. Report the output path to the user

## Tips

- Always save PDFs to `/workspace/output/` for persistence and web UI access.
- For multi-file projects, use CLI compilation instead of the API.
- BibTeX/Biber are available for bibliography management.
- Pandoc 3.1 is available for format conversion (Markdown → LaTeX, etc.).
