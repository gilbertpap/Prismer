<p align="center">
  <img src="public/prismerlogo.jpeg" alt="Prismer.AI" width="120" />
</p>

<h1 align="center">Prismer.AI</h1>

<p align="center">
  <strong>The Open Academic Research Operating System</strong>
</p>

<p align="center">
  <em>Read Papers → Analyze Data → Write Papers → Review & Publish</em>
</p>

<p align="center">
  <a href="#why-prismerai">Why Prismer.AI</a> •
  <a href="#open-source-components">Open Source</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#roadmap">Roadmap</a>
</p>

---

## Why Prismer.AI

**Academic research isn't just writing — it's a complete workflow.**

While tools like OpenAI Prism focus solely on LaTeX editing, Prismer.AI addresses the **entire research lifecycle**:

| Stage | OpenAI Prism | Prismer.AI |
|-------|--------------|------------|
| **Paper Discovery** | ❌ | ✅ arXiv, Semantic Scholar, Google Scholar integration |
| **Paper Reading** | ❌ | ✅ AI-native PDF reader with OCR, annotations, citations |
| **Data Analysis** | ❌ | ✅ Jupyter notebooks, Python/R execution, visualization |
| **Paper Writing** | ✅ LaTeX only | ✅ LaTeX + Rich text + Markdown |
| **Citation Management** | ✅ Basic | ✅ Auto-verification against databases (anti-hallucination) |
| **Academic Review** | ❌ | ✅ Reviewer Agent validates citations & data |
| **Multi-Agent Collaboration** | ❌ | ✅ Specialized agents work together |
| **Open Source Components** | ❌ | ✅ Build your own research tools |

### The Hallucination Problem

LLMs in academic contexts have a critical flaw: **fabricated citations**. An AI can write beautifully but cite papers that don't exist.

Prismer.AI solves this with the **Reviewer Agent** — a dedicated verification system that:
- Cross-references every citation against arXiv, CrossRef, and Semantic Scholar
- Validates that figures match the underlying data
- Flags logical inconsistencies before they reach your paper
- Acts as an automatic peer reviewer

---

## Open Source Components

Prismer.AI is built on a modular architecture. We're open-sourcing all core components by **March 31, 2026** to build an ecosystem:

### 📦 `@prismer/paper-reader`

AI-native PDF reader for research papers.

```tsx
import { PaperReader } from '@prismer/paper-reader';

<PaperReader
  source={{ type: 'arxiv', id: '2301.00234' }}
  onCitationClick={(citation) => openInLibrary(citation)}
  enableAIChat={true}
/>
```

**Features:**
- Multi-document view with synchronized scrolling
- OCR data integration for enhanced search
- Bi-directional citation graph
- AI chat with paper context
- Figure/table extraction for presentations

---

### 📦 `@prismer/latex-editor`

Modern LaTeX editor with real-time preview and AI assistance.

```tsx
import { LaTeXEditor } from '@prismer/latex-editor';

<LaTeXEditor
  template="ieee"
  bibliography={bibtexContent}
  onCompile={(pdf) => savePDF(pdf)}
  aiAssist={{
    model: 'claude-3-opus',
    features: ['autocomplete', 'refine', 'translate']
  }}
/>
```

**Features:**
- Real-time KaTeX preview
- Multi-file project support
- Smart error recovery with auto-fix
- Template library (IEEE, ACM, Nature, arXiv)
- Integrated BibTeX management

---

### 📦 `@prismer/academic-tools`

Unified API for academic data sources.

```typescript
import { ArxivSearch, SemanticScholar, CitationVerifier } from '@prismer/academic-tools';

// Search papers
const papers = await ArxivSearch.query({
  query: 'transformer attention mechanism',
  category: 'cs.LG',
  maxResults: 20
});

// Verify citations (anti-hallucination)
const verification = await CitationVerifier.verify(bibtexContent);
if (!verification.allValid) {
  console.log('Invalid citations:', verification.invalid);
}
```

**Supported Sources:**
- arXiv API
- Semantic Scholar
- CrossRef DOI
- Google Scholar (via proxy)
- OpenAlex

---

### 📦 `@prismer/jupyter-kernel`

Browser-native Jupyter notebook with Python/R execution.

```tsx
import { JupyterNotebook } from '@prismer/jupyter-kernel';

<JupyterNotebook
  kernel="python3"
  initialCells={cells}
  onCellExecute={(cell, output) => trackExperiment(cell, output)}
  variables={{
    data: experimentData
  }}
/>
```

**Features:**
- Full Python/R kernel support
- Variable inspector
- Plot rendering (matplotlib, plotly, seaborn)
- Cell-level execution tracking
- Integration with paper figures

---

### 📦 `@prismer/code-sandbox`

Secure code execution environment powered by WebContainer.

```tsx
import { CodePlayground } from '@prismer/code-sandbox';

<CodePlayground
  template="react"
  files={projectFiles}
  onFileChange={(files) => syncToCloud(files)}
/>
```

**Features:**
- Browser-native Node.js runtime
- React/Vue/Vanilla templates
- Real-time preview
- Terminal access
- Package installation (npm)

---

### 📦 `@prismer/agent-protocol`

Open protocol for academic AI agents.

```typescript
import { AgentOrchestrator, LiteratureAgent, DataAgent, ReviewerAgent } from '@prismer/agent-protocol';

const orchestrator = new AgentOrchestrator({
  agents: [
    new LiteratureAgent(),  // Paper discovery & citation
    new DataAgent(),        // Analysis & visualization
    new ReviewerAgent(),    // Verification & review
  ],
  tools: [arxivSearch, latexCompile, pythonExecute],
});

// Run a research task
const result = await orchestrator.run({
  task: 'Analyze the attention patterns in transformer models',
  outputDir: './research-output'
});
```

**Agent Types:**
- `BuildAgent` - Task execution & code generation
- `PlanAgent` - Research planning & design
- `LiteratureAgent` - Paper discovery & citation management
- `DataAgent` - Data analysis & statistics
- `PaperAgent` - LaTeX writing & document preparation
- `VizAgent` - Visualization & figure generation
- `ReviewerAgent` - Citation verification & quality review

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Prismer.AI Frontend                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │ Library     │  │ Jupyter     │  │ LaTeX       │  │ Paper Reader   │  │
│  │ (Discovery) │  │ (Analysis)  │  │ (Writing)   │  │ (Reading)      │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────────┘  │
│                              │ SSE Stream                                │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                     Agent Panel / Chat Interface                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Agent Orchestrator                              │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐ │
│  │ Build  │ │ Plan   │ │ Lit.   │ │ Data   │ │ Paper  │ │ Reviewer   │ │
│  │ Agent  │ │ Agent  │ │ Agent  │ │ Agent  │ │ Agent  │ │ Agent      │ │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────────┘ │
│                              │                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ Tools: arxiv_search | latex_compile | execute_code | citation_verify ││
│  └─────────────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ Skills: literature_review | data_analysis | paper_writing           ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
            │  LLM Provider │ │ Sandbox       │ │  Storage      │
            │  (Claude,     │ │ (E2B/Docker/  │ │  (S3, Qdrant, │
            │   GPT-4, etc) │ │  WebContainer)│ │   PostgreSQL) │
            └───────────────┘ └───────────────┘ └───────────────┘
```

### Key Differentiators

1. **Multi-Agent Architecture**: Specialized agents collaborate on complex research tasks, rather than relying on a single monolithic LLM.

2. **Phase-Based Execution**: Research is broken into phases (Literature Review → Data Analysis → Writing → Review), with mandatory checkpoints.

3. **Citation Verification Pipeline**: Every reference passes through a verification layer before appearing in your paper.

4. **Knowledge-Grounded RAG**: Papers you read are indexed with precise anchors, enabling accurate citations like "(Author et al., 2024, p.4)".

---

## Prismer Cloud Integration

All open source components can optionally integrate with [Prismer Cloud](https://prismer-doc.vercel.app/cloud/cloud-backend-roadmap) for enhanced features:

| Component | Cloud Feature | Benefit |
|-----------|--------------|---------|
| `@prismer/paper-reader` | Context API | Sync annotations, highlights across devices |
| `@prismer/latex-editor` | Context API | Cloud document storage, version history |
| `@prismer/academic-tools` | Context Cache (HQCC) | Fast paper metadata caching |
| `@prismer/agent-protocol` | Agent Communication | Multi-agent context sharing, real-time collaboration |

```typescript
// Example: Enable Cloud sync in Paper Reader
import { PaperReader } from '@prismer/paper-reader';
import { PrismerCloud } from '@prismer/cloud-client';

const cloud = new PrismerCloud({ apiKey: 'pk_xxx' });

<PaperReader
  source={{ type: 'arxiv', id: '2301.00234' }}
  cloudAdapter={cloud.createAdapter('paper-reader')}  // Enable cloud sync
/>
```

**Use Cases:**
- **Local Only**: Free, all data stays on your machine
- **Cloud Sync**: Annotations and documents sync via `prismer://` URIs
- **Full Platform**: Complete Prismer.AI research workspace experience

---

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm or npm
- Docker (optional, for local sandbox)

### Installation

```bash
# Clone the repository
git clone https://github.com/prismer-ai/prismer.git
cd prismer

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see Prismer.AI.

### Configuration

```env
# .env.local

# LLM Provider (choose one)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
OPENROUTER_API_KEY=sk-or-...

# Academic APIs
SEMANTIC_SCHOLAR_API_KEY=...

# Storage
DATABASE_URL=postgresql://...
S3_ENDPOINT=...
QDRANT_URL=...

# Sandbox (optional)
E2B_API_KEY=...
```

---

## Roadmap

### 🎯 Q1 2026 (by March 31) — Open Source Launch

**All components will be open-sourced by March 31, 2026:**

| Week | Milestone |
|------|-----------|
| Feb 1-7 | `@prismer/academic-tools` v0.1 — arXiv, Semantic Scholar, Citation Verifier |
| Feb 8-14 | `@prismer/paper-reader` v0.1 — PDF Reader with annotations |
| Feb 15-21 | `@prismer/latex-editor` v0.1 — LaTeX Editor with KaTeX preview |
| Feb 22-28 | `@prismer/jupyter-kernel` v0.1 — Notebook integration |
| Mar 1-7 | `@prismer/code-sandbox` v0.1 — WebContainer playground |
| Mar 8-14 | `@prismer/agent-protocol` v0.1 — Agent protocol specification |
| Mar 15-21 | Documentation site launch (docs.prismer.ai) |
| Mar 22-31 | Prismer.AI v1.0 platform release |

### ✅ Completed (Current)
- [x] Paper Reader with AI chat
- [x] LaTeX Editor with live preview
- [x] Jupyter Notebook integration
- [x] Code Playground (WebContainer)
- [x] Multi-agent orchestration
- [x] Phase-based planning

### 🚧 In Progress
- [ ] Reviewer Agent (citation verification)
- [ ] Knowledge base with RAG
- [ ] npm package extraction
- [ ] Documentation site

### 🔮 Post-Launch (Q2 2026+)
- [ ] Collaborative research workspaces
- [ ] Research project management
- [ ] Publishing pipeline integration
- [ ] Citation network visualization
- [ ] Institutional deployment

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Areas We Need Help

- **Academic Domain Experts**: Help us understand research workflows better
- **Frontend Engineers**: Improve component UX and accessibility
- **ML Engineers**: Enhance RAG and citation verification
- **Technical Writers**: Documentation and tutorials

---

## Community

- **Discord**: [Join our server](https://discord.gg/prismer) *(coming soon)*
- **Twitter**: [@prismer_ai](https://twitter.com/prismer_ai) *(coming soon)*
- **Blog**: [blog.prismer.ai](https://blog.prismer.ai) *(coming soon)*

---

## Comparison with Other Tools

| Feature | Prismer.AI | OpenAI Prism | Overleaf | Notion |
|---------|------------|--------------|----------|--------|
| Paper Reading | ✅ AI-native | ❌ | ❌ | ❌ |
| LaTeX Writing | ✅ | ✅ | ✅ | ❌ |
| Data Analysis | ✅ Jupyter | ❌ | ❌ | ❌ |
| Code Execution | ✅ Sandbox | ❌ | ❌ | ❌ |
| Citation Verification | ✅ Auto | ❌ | ❌ | ❌ |
| Multi-Agent | ✅ | ❌ | ❌ | ❌ |
| Open Source | ✅ | ❌ | ❌ | ❌ |
| Self-Hosted | ✅ | ❌ | ❌ | ❌ |

---

## License

Prismer.AI is available under dual licensing:

- **Open Source Components** (`@prismer/*` packages): MIT License
- **Prismer.AI Platform**: [Business Source License](LICENSE.md)

The open source components can be used freely in any project. The full platform requires a commercial license for production use.

---

<p align="center">
  <strong>Built for researchers, by researchers.</strong>
</p>

<p align="center">
  <sub>Stop fighting your tools. Start doing research.</sub>
</p>
