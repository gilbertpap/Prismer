# TOOLS.md — Container Tool Reference

## Available Services

| Service | URL | Purpose |
|---------|-----|---------|
| LaTeX Server | http://localhost:8080 | Compile LaTeX → PDF |
| Prover Server | http://localhost:8081 | Lean 4 / Coq / Z3 verification |
| Jupyter Server | http://localhost:8888 | Notebook kernel management |

## Pre-installed Software

- **Python 3.12**: numpy, scipy, pandas, matplotlib, sympy, scikit-learn, pytorch, transformers
- **R 4.3**: tidyverse
- **LaTeX**: TeX Live 2023 (pdflatex, xelatex, lualatex, biber, bibtex)
- **Provers**: Lean 4.27, Coq 8.18, Z3 4.15
- **System**: gcc 13.3, git 2.43, ImageMagick, ffmpeg, gnuplot, pandoc 3.1

## Notes

- Matplotlib: always use `matplotlib.use('Agg')` (no display server).
- Save all outputs to `/workspace/` for persistence.
- Jupyter token for API access: read from `$JUPYTER_TOKEN` environment variable.
