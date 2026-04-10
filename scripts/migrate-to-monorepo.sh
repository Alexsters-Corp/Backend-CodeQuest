#!/usr/bin/env bash
set -euo pipefail

# Migration script: monolith + old microservices -> clean workspaces monorepo
# Run from Backend-CodeQuest/

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[1/8] Guardando backup de la tabla learning_paths..."
mkdir -p backups
mysqldump \
  -h "${DB_HOST:-localhost}" \
  -P "${DB_PORT:-3306}" \
  -u "${DB_USER:-root}" \
  "${DB_NAME:-codequest}" \
  learning_paths > "backups/learning_paths_$(date +%Y%m%d_%H%M%S).sql"

echo "[2/8] Instalando dependencias con npm workspaces..."
npm install

echo "[3/8] Creando .env locales desde ejemplos (si no existen)..."
[[ -f services/api-gateway/.env ]] || cp services/api-gateway/.env.example services/api-gateway/.env
[[ -f services/auth-service/.env ]] || cp services/auth-service/.env.example services/auth-service/.env
[[ -f services/learning-service/.env ]] || cp services/learning-service/.env.example services/learning-service/.env

echo "[4/8] Ajustando puertos institucionales..."
# Backend: 4000-4099, Frontend: 5000-5099
# gateway=4000, auth=4001, learning=4002

cat <<'INFO'
Verifica que tus secretos JWT coincidan en:
- services/api-gateway/.env
- services/auth-service/.env
INFO

echo "[5/8] Levantando infraestructura base (MariaDB + Redis + servicios)..."
docker compose up -d --build

echo "[6/8] Health checks..."
curl -fsS http://localhost:4000/health >/dev/null
curl -fsS http://localhost:4001/health >/dev/null
curl -fsS http://localhost:4002/health >/dev/null

echo "[7/8] Validando compatibilidad learning_paths via gateway..."
curl -fsS http://localhost:4000/api/learning/paths >/dev/null

echo "[8/8] Migracion finalizada."
echo "Frontend debe consumir solo http://localhost:4000"
