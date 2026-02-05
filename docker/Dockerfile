# ── OpenPrismer — Academic AI Platform ──
# Multi-stage build: compile Next.js frontend, then layer onto academic base image
# with OpenClaw pre-installed and pre-configured.
#
# Usage:
#   docker build -t openprismer .
#   docker run -p 3000:3000 -v ./workspace:/workspace openprismer

# ════════════════════════════════════════════════════════════════
# Stage 1: Build the Next.js frontend
# ════════════════════════════════════════════════════════════════
FROM node:22-slim AS frontend-builder

WORKDIR /build

# Install deps first for layer caching
COPY web/package.json web/package-lock.json ./
RUN npm ci --no-audit --no-fund

# Copy source and build
COPY web/ ./
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ════════════════════════════════════════════════════════════════
# Stage 2: Production image on academic base
# ════════════════════════════════════════════════════════════════
FROM docker.prismer.dev/prismer-academic:v1.0

LABEL maintainer="dev@prismer.cloud"
LABEL version="4.0.0"
LABEL description="Prismer Academic Platform v4 — AI-powered academic research workstation"

# ── Install Node.js 22 + OpenClaw ──
USER root

RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs xxd && \
    apt-get clean && rm -rf /var/lib/apt/lists/* && \
    npm install -g openclaw@latest

# ── Copy application files ──
WORKDIR /app

# Config templates (copied to /workspace on first run)
COPY config/ ./config/

# Academic skills (copied to /workspace/skills on first run)
COPY skills/ ./skills/

# CLI scripts (paper-search, etc.)
COPY scripts/ ./scripts/
RUN chmod +x /app/scripts/*.py 2>/dev/null || true

# Built Next.js frontend
COPY --from=frontend-builder /build/.next/standalone ./web/
COPY --from=frontend-builder /build/.next/static ./web/.next/static

# Custom server (if exists, for WebSocket PTY support)
# COPY --from=frontend-builder /build/server.js ./web/server.js

# Entrypoint
COPY entrypoint.sh ./
RUN chmod +x /app/entrypoint.sh

# ── Directories + Permissions ──
RUN mkdir -p /workspace/{projects,notebooks,output,skills,.openclaw/workspace} && \
    chown -R user:user /workspace /app

# ── Expose only the frontend port ──
# Internal services (LaTeX :8080, Prover :8081, Jupyter :8888, Gateway :18900)
# are only accessible within the container.
EXPOSE 3000

# ── Persistent data ──
VOLUME ["/workspace"]

# ── Environment ──
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV FRONTEND_PORT=3000
ENV LATEX_PORT=8080
ENV PROVER_PORT=8081
ENV JUPYTER_PORT=8888
ENV GATEWAY_PORT=18900

USER user
WORKDIR /workspace

ENTRYPOINT ["/app/entrypoint.sh"]
