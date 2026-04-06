#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/server"
./.venv/bin/python manage.py export_openapi_schema \
  --api config.api.api \
  --output "$ROOT/api/openapi.json" \
  --indent 2
