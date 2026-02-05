#!/bin/bash
# ── OpenPrismer — Container Entrypoint ──
# Starts all services: LaTeX, Prover, Jupyter, OpenClaw Gateway, Web Frontend.
# Designed for single-command startup: docker run -p 3000:3000 openprismer

set -e

# ── Colors ──
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

# ── Configuration ──
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
LATEX_PORT="${LATEX_PORT:-8080}"
PROVER_PORT="${PROVER_PORT:-8081}"
JUPYTER_PORT="${JUPYTER_PORT:-8888}"
GATEWAY_PORT="${GATEWAY_PORT:-18900}"
WORKSPACE="/workspace"
OPENCLAW_HOME="${WORKSPACE}/.openclaw"
OPENCLAW_CONFIG="${OPENCLAW_HOME}/openclaw.json"
JUPYTER_TOKEN="${JUPYTER_TOKEN:-openprismer-jupyter-$(head -c 8 /dev/urandom | xxd -p)}"

export JUPYTER_TOKEN

# ── Detect LAN IP ──
get_lan_ip() {
  local ip=""
  ip=$(hostname -I 2>/dev/null | awk '{print $1}')
  [ -z "$ip" ] && ip=$(ip -4 addr show scope global 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -1)
  [ -z "$ip" ] && ip="localhost"
  echo "$ip"
}

LAN_IP=$(get_lan_ip)

# ── Banner ──
echo ""
echo -e "${BOLD}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║        ${CYAN}🔬 OpenPrismer Academic Platform${NC}${BOLD}            ║${NC}"
echo -e "${BOLD}╠════════════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}║${NC}                                                    ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}  ${GREEN}🌐 Web UI:${NC}  http://${LAN_IP}:${FRONTEND_PORT}              ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}                                                    ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}  ${YELLOW}Open the URL above to get started!${NC}               ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}                                                    ${BOLD}║${NC}"
echo -e "${BOLD}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# ── Initialize workspace on first run ──
init_workspace() {
  echo -e "${CYAN}[init]${NC} Initializing workspace..."

  # Create standard directories
  mkdir -p "${WORKSPACE}"/{projects,notebooks,output,skills}
  mkdir -p "${OPENCLAW_HOME}/workspace"

  # Symlink OpenClaw home to user's home directory (OpenClaw looks at $HOME/.openclaw)
  if [ ! -e "${HOME}/.openclaw" ]; then
    ln -sfn "${OPENCLAW_HOME}" "${HOME}/.openclaw"
    echo -e "${CYAN}[init]${NC}   Linked ${HOME}/.openclaw -> ${OPENCLAW_HOME}"
  fi

  # Set up git defaults if not configured
  if ! git config --global user.email &>/dev/null; then
    git config --global user.email "user@openprismer.local"
    git config --global user.name "OpenPrismer User"
    git config --global init.defaultBranch main
    echo -e "${CYAN}[init]${NC}   Configured git defaults"
  fi

  # Symlink CLI tools to PATH
  if [ -d /app/scripts ]; then
    ln -sfn /app/scripts/paper-search.py /home/user/.local/bin/paper-search
    echo -e "${CYAN}[init]${NC}   Linked paper-search CLI"
  fi

  # Copy agent persona files if not present
  for f in AGENTS.md SOUL.md IDENTITY.md TOOLS.md; do
    if [ ! -f "${OPENCLAW_HOME}/workspace/${f}" ]; then
      cp "/app/config/${f}" "${OPENCLAW_HOME}/workspace/${f}"
      echo -e "${CYAN}[init]${NC}   Copied ${f}"
    fi
  done

  # Always sync skills from image (allows updates)
  mkdir -p "${WORKSPACE}/skills"
  cp -r /app/skills/* "${WORKSPACE}/skills/"
  echo -e "${CYAN}[init]${NC}   Synced academic skills"

  # Symlink workspace skills into OpenClaw workspace so agent can find them
  ln -sfn "${WORKSPACE}/skills" "${OPENCLAW_HOME}/workspace/skills"

  # Generate OpenClaw config if not present
  if [ ! -f "${OPENCLAW_CONFIG}" ]; then
    # Generate a random auth token
    local token
    token=$(head -c 24 /dev/urandom | xxd -p)

    # Copy template and replace placeholder token
    sed "s/__REPLACE_ON_FIRST_RUN__/${token}/" /app/config/openclaw.json > "${OPENCLAW_CONFIG}"

    # Save the token for the frontend to read
    echo "${token}" > "${OPENCLAW_HOME}/.gateway-token"
    chmod 600 "${OPENCLAW_HOME}/.gateway-token"

    echo -e "${CYAN}[init]${NC}   Generated OpenClaw config with auth token"
  fi

  echo -e "${GREEN}[init]${NC} Workspace ready."
}

# Run initialization
init_workspace

# ── Start services ──
PIDS=()

# 1. LaTeX compile server
echo -e "${CYAN}[start]${NC} LaTeX server on :${LATEX_PORT}..."
python3 /home/user/.local/bin/latex-server.py --port "${LATEX_PORT}" &
PIDS+=($!)

# 2. Prover server
echo -e "${CYAN}[start]${NC} Prover server on :${PROVER_PORT}..."
python3 /home/user/.local/bin/prover-server.py --port "${PROVER_PORT}" &
PIDS+=($!)

# 3. Jupyter server (headless, internal only)
echo -e "${CYAN}[start]${NC} Jupyter server on :${JUPYTER_PORT} (internal)..."
jupyter server --no-browser \
  --port="${JUPYTER_PORT}" \
  --ip=127.0.0.1 \
  --ServerApp.token="${JUPYTER_TOKEN}" \
  --ServerApp.allow_remote_access=false \
  --ServerApp.log_level=WARN \
  2>&1 | sed 's/^/  [jupyter] /' &
PIDS+=($!)

# 4. OpenClaw Gateway (run in foreground mode for containers)
echo -e "${CYAN}[start]${NC} OpenClaw Gateway on :${GATEWAY_PORT}..."
export OPENCLAW_HOME
openclaw gateway run --port "${GATEWAY_PORT}" --bind loopback 2>&1 | sed 's/^/  [openclaw] /' &
PIDS+=($!)

# 5. Wait for Gateway to be ready before starting frontend
sleep 3

# 6. Web frontend
echo -e "${CYAN}[start]${NC} Web frontend on :${FRONTEND_PORT}..."
cd /app/web

# Export environment variables for Next.js server
export GATEWAY_URL="http://127.0.0.1:${GATEWAY_PORT}"
export GATEWAY_TOKEN="$(cat "${OPENCLAW_HOME}/.gateway-token" 2>/dev/null || echo '')"
export JUPYTER_URL="http://127.0.0.1:${JUPYTER_PORT}"
export PORT="${FRONTEND_PORT}"
export HOSTNAME="0.0.0.0"
export NODE_ENV=production

# Start Node with environment variables (use bash -c to ensure proper inheritance)
bash -c "GATEWAY_URL='${GATEWAY_URL}' GATEWAY_TOKEN='${GATEWAY_TOKEN}' JUPYTER_URL='${JUPYTER_URL}' JUPYTER_TOKEN='${JUPYTER_TOKEN}' PORT='${PORT}' HOSTNAME='${HOSTNAME}' NODE_ENV='${NODE_ENV}' exec node server.js" &
PIDS+=($!)

# ── Ready ──
sleep 2
echo ""
echo -e "${GREEN}[ready]${NC} All services started."
echo -e "${GREEN}[ready]${NC} Open ${BOLD}http://${LAN_IP}:${FRONTEND_PORT}${NC} in your browser."
echo ""

# ── Graceful shutdown ──
cleanup() {
  echo ""
  echo -e "${YELLOW}[shutdown]${NC} Stopping services..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null
  done
  wait 2>/dev/null
  echo -e "${GREEN}[done]${NC} Bye!"
  exit 0
}

trap cleanup SIGTERM SIGINT

# Keep alive — exit if any critical service dies
wait -n
echo -e "${RED}[error]${NC} A service exited unexpectedly. Shutting down."
cleanup
