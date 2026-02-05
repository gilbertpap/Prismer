---
name: academic-workspace
description: Manage the academic workspace — project structure, templates, and output organization.
metadata:
  openclaw:
    emoji: "📁"
    os: ["linux"]
    category: academic
---

# Academic Workspace — Project Management

## Overview

The workspace at `/workspace/` is a persistent volume that survives container
restarts. Use it for all user data: projects, notebooks, output files.

## Directory Structure

```
/workspace/
├── projects/          # Research projects (one directory per project)
│   └── my-paper/
│       ├── main.tex
│       ├── sections/
│       ├── figures/
│       ├── references.bib
│       └── Makefile
├── notebooks/         # Jupyter notebooks
│   └── analysis.ipynb
├── output/            # Compiled PDFs, plots, results
│   ├── paper.pdf
│   └── figure1.png
├── skills/            # Academic skills (auto-managed)
└── .openclaw/         # OpenClaw configuration (auto-managed)
```

## When To Use

- User starts a new research project
- User asks to organize files or set up a project structure
- User needs paper templates

## Create a New Project

### LaTeX paper project

```bash
PROJECT="/workspace/projects/my-paper"
mkdir -p "$PROJECT"/{sections,figures}

# Create main.tex
cat > "$PROJECT/main.tex" << 'TEX'
\documentclass[11pt]{article}
\usepackage[utf8]{inputenc}
\usepackage{amsmath,amssymb}
\usepackage{graphicx}
\usepackage{hyperref}
\usepackage[style=numeric,backend=biber]{biblatex}
\addbibresource{references.bib}

\title{Paper Title}
\author{Author Name}
\date{\today}

\begin{document}
\maketitle

\input{sections/abstract}
\input{sections/introduction}
\input{sections/method}
\input{sections/experiments}
\input{sections/conclusion}

\printbibliography
\end{document}
TEX

# Create section stubs
for sec in abstract introduction method experiments conclusion; do
  echo "\\section{$(echo $sec | sed 's/.*/\u&/')}" > "$PROJECT/sections/$sec.tex"
  echo "% TODO: Write $sec" >> "$PROJECT/sections/$sec.tex"
done

# Create empty bibliography
cat > "$PROJECT/references.bib" << 'BIB'
% Bibliography — add entries here
% Example:
% @article{key2024,
%   author  = {Last, First},
%   title   = {Title},
%   journal = {Journal},
%   year    = {2024},
% }
BIB

# Create Makefile for easy compilation
cat > "$PROJECT/Makefile" << 'MAKE'
all: main.pdf

main.pdf: main.tex sections/*.tex references.bib
	pdflatex -interaction=nonstopmode main.tex
	biber main
	pdflatex -interaction=nonstopmode main.tex
	pdflatex -interaction=nonstopmode main.tex
	cp main.pdf /workspace/output/

clean:
	rm -f *.aux *.bbl *.bcf *.blg *.log *.out *.run.xml *.toc *.pdf

.PHONY: all clean
MAKE

echo "Project created at: $PROJECT"
```

### Python data analysis project

```bash
PROJECT="/workspace/projects/analysis"
mkdir -p "$PROJECT"/{data,results,figures}

cat > "$PROJECT/README.md" << 'MD'
# Data Analysis Project

## Structure
- `data/` — raw and processed datasets
- `results/` — analysis outputs
- `figures/` — generated plots
- `analysis.py` — main analysis script
MD

echo "Project created at: $PROJECT"
```

## Available Templates

When creating a LaTeX project, ask the user which template they prefer:

| Template | Use case | Engine |
|----------|----------|--------|
| `article` | General papers | pdflatex |
| `article-zh` | Chinese papers | xelatex |
| `beamer` | Presentations/slides | pdflatex |
| `ieee` | IEEE conference format | pdflatex |

Check available templates: `curl -sf http://localhost:8080/templates | jq .`

## Compile a Project

```bash
cd /workspace/projects/my-paper
make              # Uses Makefile
# or manually:
pdflatex main.tex && biber main && pdflatex main.tex && pdflatex main.tex
```

## Tips

- Always save outputs to `/workspace/output/` — the web UI can display PDFs from there.
- Keep projects self-contained: all deps inside the project directory.
- Use Makefiles for reproducible compilation.
- Git is available for version control: `cd /workspace/projects/my-paper && git init`.
