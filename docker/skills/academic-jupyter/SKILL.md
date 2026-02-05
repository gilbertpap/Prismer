---
name: academic-jupyter
description: Manage Jupyter notebooks — create, execute cells, manage kernels via the container's Jupyter Server REST API.
metadata:
  openclaw:
    emoji: "📓"
    os: ["linux"]
    category: academic
---

# Academic Jupyter — Notebook Management

## Overview

A headless Jupyter Server runs at `http://localhost:8888` inside the container.
Use its REST API and kernel WebSocket protocol to create notebooks, manage
kernels, and execute code cells. The Jupyter token is in `$JUPYTER_TOKEN`.

## When To Use

- User asks to create or run a Jupyter notebook
- User wants an interactive computing session with persistent state
- User needs to execute multi-step data analysis with shared variables
- User asks for a notebook-style workflow (code → output → iterate)

## Authentication

All requests require the token:

```bash
# Token is available as environment variable
echo $JUPYTER_TOKEN

# Use in requests:
curl -sf "http://localhost:8888/api/status?token=$JUPYTER_TOKEN" | jq .
```

## Kernel Management

### List running kernels

```bash
curl -sf "http://localhost:8888/api/kernels?token=$JUPYTER_TOKEN" | jq .
```

### Start a new kernel

```bash
curl -sf -X POST "http://localhost:8888/api/kernels?token=$JUPYTER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "python3"}' | jq .
# → {"id": "<kernel-id>", "name": "python3", "state": "starting", ...}
```

### Restart a kernel (clears state)

```bash
curl -sf -X POST "http://localhost:8888/api/kernels/<kernel-id>/restart?token=$JUPYTER_TOKEN" | jq .
```

### Shutdown a kernel

```bash
curl -sf -X DELETE "http://localhost:8888/api/kernels/<kernel-id>?token=$JUPYTER_TOKEN"
```

## Notebook File Management (Contents API)

### List notebooks

```bash
curl -sf "http://localhost:8888/api/contents/notebooks?token=$JUPYTER_TOKEN" | jq '.content[] | {name, path, type}'
```

### Create a new notebook

```bash
curl -sf -X PUT "http://localhost:8888/api/contents/notebooks/analysis.ipynb?token=$JUPYTER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "notebook",
    "content": {
      "cells": [
        {
          "cell_type": "markdown",
          "source": "# Analysis Notebook\nCreated by Prismer Academic Assistant.",
          "metadata": {}
        },
        {
          "cell_type": "code",
          "source": "import numpy as np\nimport matplotlib.pyplot as plt\nprint(\"Ready!\")",
          "metadata": {},
          "outputs": [],
          "execution_count": null
        }
      ],
      "metadata": {
        "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
        "language_info": {"name": "python", "version": "3.12.3"}
      },
      "nbformat": 4,
      "nbformat_minor": 5
    }
  }' | jq '{name, path, created}'
```

### Read a notebook

```bash
curl -sf "http://localhost:8888/api/contents/notebooks/analysis.ipynb?token=$JUPYTER_TOKEN" | jq .
```

### Delete a notebook

```bash
curl -sf -X DELETE "http://localhost:8888/api/contents/notebooks/analysis.ipynb?token=$JUPYTER_TOKEN"
```

## Execute Code in a Kernel

For executing code, use the Jupyter kernel's execute endpoint.
The simplest approach: write code to a `.py` file and run it, or use the
REST API to execute within a kernel session.

### Quick execution via file

```bash
# Write a cell's code to temp file and execute
cat > /tmp/cell.py << 'PYTHON'
import numpy as np
x = np.random.randn(1000)
print(f"Mean: {x.mean():.4f}, Std: {x.std():.4f}")
PYTHON

python3 /tmp/cell.py
```

### For persistent state across cells

When the user needs variables to persist between executions (true notebook
experience), start a kernel and use the Jupyter execute API:

```bash
# 1. Start kernel
KERNEL_ID=$(curl -sf -X POST "http://localhost:8888/api/kernels?token=$JUPYTER_TOKEN" \
  -H "Content-Type: application/json" -d '{"name":"python3"}' | jq -r '.id')

# 2. Execute code via the kernel (uses WebSocket internally)
# For simple cases, write the notebook with cells and outputs.
# For complex interactive sessions, guide the user to open Jupyter in browser.
```

## API Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/status` | GET | Server status |
| `/api/kernels` | GET | List kernels |
| `/api/kernels` | POST | Start kernel (`{"name":"python3"}`) |
| `/api/kernels/<id>` | DELETE | Shutdown kernel |
| `/api/kernels/<id>/restart` | POST | Restart kernel |
| `/api/contents/<path>` | GET | Read file/notebook |
| `/api/contents/<path>` | PUT | Create/update file/notebook |
| `/api/contents/<path>` | DELETE | Delete file/notebook |

All endpoints require `?token=$JUPYTER_TOKEN` query parameter.

## Notebook Storage

- Default notebook directory: `/workspace/notebooks/`
- The Jupyter server serves files from `/workspace/`
- Save notebooks to `/workspace/notebooks/<name>.ipynb`

## Tips

- For simple one-off computations, use `python3` directly (academic-python skill).
- Use Jupyter when the user needs **persistent state** across multiple code executions.
- Always include `matplotlib.use('Agg')` in visualization cells.
- Kernel state is lost on restart — save important results to files.
- The web frontend may have a Notebook Viewer for rendering `.ipynb` files.
