---
name: academic-search
description: Search and download academic papers from arXiv. Find papers by keywords, authors, or arXiv ID.
metadata:
  openclaw:
    emoji: "📚"
    os: ["linux"]
    category: academic
---

# Academic Search — Paper Discovery

## Overview

Search academic papers on arXiv using the `paper-search` CLI tool.
**No API key required** — uses the free arXiv API directly.

## When To Use

- User asks to find/search papers on a topic
- User wants paper recommendations
- User needs to download a paper PDF
- User mentions arXiv, academic papers, or research literature

## Commands

### Search papers by keyword

```bash
paper-search search "transformer attention mechanism" --max 5
```

### Search with category filter

```bash
paper-search search "reinforcement learning" --max 10 --categories cs.AI,cs.LG
```

### Get paper details by arXiv ID

```bash
paper-search details 1706.03762
```

### Download paper PDF

```bash
paper-search download 1706.03762 --output /workspace/papers/
```

### JSON output (for programmatic use)

```bash
paper-search search "neural networks" --max 3 --json
```

## Example Workflows

### Find important papers on a topic

```bash
# Search for recent transformer papers
paper-search search "vision transformer ViT" --max 10 --categories cs.CV

# Get details of the seminal paper
paper-search details 2010.11929
```

### Build a reading list

```bash
# Search and save results
paper-search search "large language models" --max 20 --json > /workspace/papers/llm-papers.json

# Download key papers
paper-search download 2005.14165 -o /workspace/papers/  # GPT-3
paper-search download 2302.13971 -o /workspace/papers/  # LLaMA
```

### Research a specific author

```bash
paper-search search "au:Hinton" --max 10
```

## arXiv Categories

Common categories for filtering:

| Category | Description |
|----------|-------------|
| cs.AI | Artificial Intelligence |
| cs.LG | Machine Learning |
| cs.CL | Computation and Language (NLP) |
| cs.CV | Computer Vision |
| cs.NE | Neural and Evolutionary Computing |
| cs.RO | Robotics |
| stat.ML | Statistics - Machine Learning |
| math.OC | Optimization and Control |

## Search Tips

- Use quotes for exact phrases: `"attention is all you need"`
- Search by author: `au:Vaswani`
- Search by title: `ti:transformer`
- Combine: `"neural network" AND au:LeCun`
- arXiv ID format: `1706.03762` or `cs.AI/0001001`

## Output Locations

- Papers list: stdout or `--json` to file
- Downloaded PDFs: `/workspace/papers/` (default)

## Important Notes

- arXiv API has rate limits; avoid rapid-fire requests
- PDFs are typically 1-10 MB each
- Search results are sorted by relevance by default
- Published dates are in YYYY-MM-DD format
