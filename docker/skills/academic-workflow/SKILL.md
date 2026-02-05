---
name: academic-workflow
description: Execute complex multi-step academic research workflows like literature surveys, benchmark analysis, and paper writing.
metadata:
  openclaw:
    emoji: "🔄"
    os: ["linux"]
    category: academic
---

# Academic Workflow — Complex Research Tasks

## Overview

For complex multi-step tasks (surveys, analyses, paper writing), break them into discrete steps and execute sequentially. This prevents timeouts and allows progress tracking.

## When To Use

- User requests a literature survey or review
- User wants benchmark comparison across papers
- User needs end-to-end research workflow (search → analyze → visualize → write)
- Task involves more than 3 tool calls

## Strategy: Divide and Conquer

**IMPORTANT**: For complex tasks, execute ONE step at a time, report progress, then continue.

### Example: Paper Survey Workflow

Instead of trying everything at once:

```
❌ Bad: Try to search, analyze, visualize, and write in one go
✅ Good: Execute step by step with checkpoints
```

## Step-by-Step Template

### Step 1: Search and Save

```bash
# Search papers and save to JSON
paper-search search "your topic" --max 10 --json > /workspace/projects/papers.json
echo "Step 1 complete: Found $(cat /workspace/projects/papers.json | python3 -c 'import json,sys; print(len(json.load(sys.stdin)))') papers"
```

### Step 2: Extract Data to CSV

```bash
/home/user/.venv/bin/python3 << 'PYTHON'
import json
import pandas as pd

with open('/workspace/projects/papers.json') as f:
    papers = json.load(f)

data = []
for p in papers:
    data.append({
        'id': p['id'],
        'title': p['title'][:80],
        'authors': ', '.join(p['authors'][:3]),
        'published': p['published'],
        'categories': ', '.join(p['categories'])
    })

df = pd.DataFrame(data)
df.to_csv('/workspace/output/papers.csv', index=False)
print(f"Step 2 complete: Saved {len(df)} papers to CSV")
PYTHON
```

### Step 3: Visualize

```bash
/home/user/.venv/bin/python3 << 'PYTHON'
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

df = pd.read_csv('/workspace/output/papers.csv')

fig, ax = plt.subplots(figsize=(10, 6))
# Your visualization code here
plt.savefig('/workspace/output/analysis.png', dpi=150, bbox_inches='tight')
print("Step 3 complete: Saved visualization")
PYTHON
```

### Step 4: Generate LaTeX

```bash
cat > /workspace/projects/survey.tex << 'LATEX'
\documentclass{article}
\usepackage{graphicx}
\begin{document}
\title{Survey Title}
\maketitle
% Content here
\end{document}
LATEX
echo "Step 4 complete: Generated LaTeX"
```

### Step 5: Compile PDF

```bash
cd /workspace/projects && pdflatex -interaction=nonstopmode survey.tex
cp survey.pdf /workspace/output/
echo "Step 5 complete: PDF at /workspace/output/survey.pdf"
```

## Progress Reporting

After each step, report:
1. What was completed
2. Output file locations
3. What comes next

Example output:
```
✅ Step 1/5: Found 10 papers on VLA
   → /workspace/projects/papers.json

✅ Step 2/5: Extracted benchmark data
   → /workspace/output/benchmarks.csv

Continuing to Step 3: Visualization...
```

## Common Workflows

### Literature Survey
1. Search papers (paper-search)
2. Extract metadata to CSV
3. Analyze trends (pandas)
4. Create visualizations (seaborn)
5. Write LaTeX survey
6. Generate BibTeX
7. Compile PDF

### Benchmark Comparison
1. Search papers with benchmark mentions
2. Extract performance metrics
3. Create comparison table
4. Visualize results
5. Write analysis

### Replication Study
1. Download paper PDF
2. Extract methodology
3. Implement code
4. Run experiments
5. Compare results
6. Write report

## Timeout Prevention

- Break tasks into 2-3 minute chunks
- Save intermediate results to files
- Use `--json` output for programmatic processing
- Avoid downloading large files mid-workflow

## File Organization

```
/workspace/
├── projects/
│   └── my-survey/
│       ├── papers.json      # Raw search results
│       ├── survey.tex       # LaTeX source
│       ├── references.bib   # BibTeX
│       └── figures/         # Generated plots
└── output/
    ├── survey.pdf           # Final PDF
    ├── data.csv             # Extracted data
    └── analysis.png         # Visualizations
```
