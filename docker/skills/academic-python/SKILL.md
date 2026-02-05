---
name: academic-python
description: Execute Python for scientific computing, data analysis, and visualization. Full scientific stack pre-installed.
metadata:
  openclaw:
    emoji: "🐍"
    os: ["linux"]
    category: academic
---

# Academic Python — Scientific Computing

## Overview

Execute Python 3.12 with a full scientific computing stack pre-installed.
You are running **inside** the container — use `python3` directly, no `docker exec` needed.

## When To Use

- User asks to run Python code, analyze data, or create plots
- User needs scientific computation (linear algebra, statistics, symbolic math)
- User wants charts, visualizations, or data processing

## CRITICAL: Output File Location

**ALWAYS save outputs to `/workspace/output/`** — this directory is monitored by the UI.

When you save a file, you MUST report the full path in your response so the UI can display it:

```
保存完成：/workspace/output/chart.png
```

The UI will automatically detect paths like `/workspace/output/xxx.png` and display the file.

## Quick Execution

**Important**: Always use `/home/user/.venv/bin/python3` for the full scientific stack.

### Visualization Example (CORRECT)

```bash
/home/user/.venv/bin/python3 << 'PYTHON'
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Required: no display server
import matplotlib.pyplot as plt

x = np.linspace(0, 2 * np.pi, 100)
y = np.sin(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y, 'b-', linewidth=2)
plt.title('Sine Wave')
plt.xlabel('x')
plt.ylabel('sin(x)')
plt.grid(True)

# MUST save to /workspace/output/
output_path = '/workspace/output/sine_wave.png'
plt.savefig(output_path, dpi=150, bbox_inches='tight')
print(f'图表已保存：{output_path}')
PYTHON
```

After running, tell the user: **"图表已保存到 /workspace/output/sine_wave.png"**

### Inline (short scripts)

```bash
/home/user/.venv/bin/python3 -c "
import numpy as np
x = np.array([1, 2, 3, 4, 5])
print(f'Mean: {np.mean(x):.2f}')
print(f'Std:  {np.std(x):.2f}')
"
```

### Data analysis with Pandas

```bash
/home/user/.venv/bin/python3 << 'PYTHON'
import pandas as pd

data = {'name': ['Alice', 'Bob', 'Charlie'], 'score': [95, 87, 92]}
df = pd.DataFrame(data)
print(df.describe())

# Save results
output_path = '/workspace/output/analysis.csv'
df.to_csv(output_path, index=False)
print(f'数据已保存：{output_path}')
PYTHON
```

### Symbolic math with SymPy

```bash
/home/user/.venv/bin/python3 -c "
from sympy import symbols, integrate, diff, latex
x = symbols('x')
f = x**3 + 2*x**2 - x + 1
print(f'f(x)  = {f}')
print(f\"f'(x) = {diff(f, x)}\")
print(f'∫f dx = {integrate(f, x)}')
"
```

### Machine learning with scikit-learn

```bash
/home/user/.venv/bin/python3 << 'PYTHON'
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)
print(f"Accuracy: {accuracy_score(y_test, clf.predict(X_test)):.2%}")
PYTHON
```

## Pre-installed Packages

| Category | Packages |
|----------|----------|
| **Numerical** | numpy, scipy |
| **Data** | pandas, polars |
| **Visualization** | matplotlib, seaborn, plotly |
| **Symbolic math** | sympy |
| **ML/AI** | scikit-learn, pytorch, transformers |
| **Statistics** | statsmodels |
| **NLP** | nltk, spacy |
| **Image** | Pillow, opencv-python |
| **Other** | requests, tqdm, pyyaml, h5py |

## Important Notes

- **Always** use `matplotlib.use('Agg')` before importing `pyplot` (no display server).
- **ALWAYS** save outputs (plots, CSVs, data) to `/workspace/output/` — the UI monitors this directory!
- **ALWAYS** print the full output path so the UI can detect and display the file.
- For long-running scripts, consider writing progress to stdout.
- R 4.3 with tidyverse is also available: `Rscript -e "library(tidyverse); ..."`.
- pip is available if you need additional packages: `pip install <package>`.

## File Locations

| Purpose | Path |
|---------|------|
| Save outputs | `/workspace/output/` (UI monitored!) |
| Temp scripts | `/tmp/` |
| User projects | `/workspace/projects/` |
| Notebooks | `/workspace/notebooks/` |
