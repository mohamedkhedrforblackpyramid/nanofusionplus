#!/usr/bin/env bash
# تشغيل الموقع محلياً: ./serve.sh   أو   bash serve.sh
cd "$(dirname "$0")" || exit 1
PORT="${PORT:-8080}"
echo "افتح المتصفح على: http://127.0.0.1:${PORT}/"
echo "للإيقاف: Ctrl+C"
exec python3 -m http.server "$PORT"
