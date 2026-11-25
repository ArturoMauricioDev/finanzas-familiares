#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"

BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/frontend-mobile/.env}"
EXPO_CMD="${EXPO_CMD:-pnpm exec expo start --dev-client --tunnel ngrok}"
TUNNEL_ATTEMPTS="${TUNNEL_ATTEMPTS:-3}"
START_DOCKER=1
START_EXPO=0
CLEAR_CACHE=0

PID_DIR="${XDG_RUNTIME_DIR:-/tmp}"
PID_FILE="$PID_DIR/kitho-cloudflared.pid"
LOG_FILE="$PID_DIR/kitho-cloudflared.log"

usage() {
  cat <<'EOF'
Uso: scripts/dev-tunnel.sh [opciones]

Levanta Docker Compose y un quick tunnel de Cloudflare, y actualiza
EXPO_PUBLIC_API_URL en frontend-mobile/.env con la URL generada.

Opciones:
  --no-docker          No levanta Docker ni espera a /health.
  --expo               Inicia Metro/Expo tras actualizar .env.
  --clear              Igual que --expo, pero limpia la caché de Metro
                       (equivale a `expo start --clear`).
  --url URL            URL local a exponer (por defecto http://localhost:8000).
  --env-file RUTA      Archivo .env a actualizar (por defecto frontend-mobile/.env).
  --stop               Detiene un túnel que haya quedado en ejecución.
  -h, --help           Muestra esta ayuda.

Variables de entorno:
  BACKEND_URL          Igual que --url.
  ENV_FILE             Igual que --env-file.
  EXPO_CMD             Comando de Expo (por defecto:
                       "pnpm exec expo start --dev-client --tunnel ngrok").
                       Usa "ngrok" para no depender de una cuenta de Expo; el
                       proveedor "expo" requiere `pnpm exec expo login`.
  TUNNEL_ATTEMPTS      Intentos para crear el túnel (por defecto: 3).

Nota: la URL *.trycloudflare.com cambia en cada arranque. Los EXPO_PUBLIC_*
se inyectan al empaquetar, así que reinicia Metro con `pnpm start -c`.
EOF
}

stop_tunnel() {
  if [ ! -f "$PID_FILE" ]; then
    return 0
  fi
  local old_pid
  old_pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [ -n "$old_pid" ] && kill -0 "$old_pid" 2>/dev/null; then
    echo "Deteniendo túnel anterior (PID $old_pid)..."
    kill "$old_pid" 2>/dev/null || true
    for _ in $(seq 1 20); do
      kill -0 "$old_pid" 2>/dev/null || break
      sleep 0.1
    done
    kill -9 "$old_pid" 2>/dev/null || true
  fi
  rm -f "$PID_FILE"
}

while [ $# -gt 0 ]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --no-docker)
      START_DOCKER=0
      ;;
    --expo)
      START_EXPO=1
      ;;
    --clear)
      START_EXPO=1
      CLEAR_CACHE=1
      ;;
    --url)
      BACKEND_URL="${2:?Falta el valor de --url}"
      shift
      ;;
    --env-file)
      ENV_FILE="${2:?Falta el valor de --env-file}"
      shift
      ;;
    --stop)
      stop_tunnel
      echo "Túnel detenido."
      exit 0
      ;;
    *)
      echo "Opción desconocida: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
  shift
done

download_binary_from_github() {
  local bin="$1" arch="$2"
  curl -fsSL --connect-timeout 10 --max-time 300 \
    "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-$arch" \
    -o "$bin.tmp" || return 1
  chmod +x "$bin.tmp"
  mv "$bin.tmp" "$bin"
}

download_from_cloudflare_repo() {
  local bin="$1" arch="$2" deb_arch filename deb extract found
  case "$arch" in
    amd64) deb_arch="amd64" ;;
    arm64) deb_arch="arm64" ;;
    arm) deb_arch="armhf" ;;
    *) return 1 ;;
  esac

  local packages_url="https://pkg.cloudflare.com/cloudflared/dists/any/main/binary-$deb_arch/Packages"
  filename="$(curl -fsSL --connect-timeout 10 --max-time 60 "$packages_url" \
    | awk '/^Filename:/ { print $2; exit }')"
  [ -n "$filename" ] || return 1

  deb="$bin.deb"
  curl -fsSL --connect-timeout 10 --max-time 300 \
    "https://pkg.cloudflare.com/cloudflared/$filename" -o "$deb" || return 1

  extract="$bin.extract"
  rm -rf "$extract"
  mkdir -p "$extract"
  if command -v dpkg-deb >/dev/null 2>&1; then
    dpkg-deb -x "$deb" "$extract" || { rm -rf "$extract" "$deb"; return 1; }
  elif command -v ar >/dev/null 2>&1; then
    (cd "$extract" && ar x "$deb" && tar -xf data.tar.*) \
      || { rm -rf "$extract" "$deb"; return 1; }
  else
    rm -rf "$extract" "$deb"
    return 1
  fi

  found="$(find "$extract" -type f -name cloudflared | head -n1)"
  if [ -z "$found" ]; then
    rm -rf "$extract" "$deb"
    return 1
  fi
  cp "$found" "$bin.tmp"
  chmod +x "$bin.tmp"
  mv "$bin.tmp" "$bin"
  rm -rf "$extract" "$deb"
}

find_cloudflared() {
  if command -v cloudflared >/dev/null 2>&1; then
    command -v cloudflared
    return 0
  fi

  local cache_dir bin arch
  cache_dir="${XDG_CACHE_HOME:-$HOME/.cache}/kitho"
  bin="$cache_dir/cloudflared"
  if [ -x "$bin" ]; then
    printf '%s\n' "$bin"
    return 0
  fi

  case "$(uname -m)" in
    x86_64|amd64) arch="amd64" ;;
    aarch64|arm64) arch="arm64" ;;
    armv7l|armv6l) arch="arm" ;;
    *)
      echo "Arquitectura no soportada por la descarga automática: $(uname -m)" >&2
      return 1
      ;;
  esac

  echo "cloudflared no encontrado; descargando en $bin..." >&2
  mkdir -p "$cache_dir"

  if download_from_cloudflare_repo "$bin" "$arch"; then
    :
  elif download_binary_from_github "$bin" "$arch"; then
    :
  else
    rm -f "$bin.tmp" "$bin.deb"
    echo "No se pudo descargar cloudflared automáticamente." >&2
    echo "Instálalo manualmente: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/" >&2
    return 1
  fi

  printf '%s\n' "$bin"
}

compose_cmd() {
  if docker compose version >/dev/null 2>&1; then
    COMPOSE=(docker compose)
  elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE=(docker-compose)
  else
    echo "Docker Compose no está disponible." >&2
    return 1
  fi
}

start_backend() {
  compose_cmd
  echo "Levantando backend y base de datos..."
  (cd "$ROOT_DIR" && "${COMPOSE[@]}" up -d)

  echo "Esperando a $BACKEND_URL/health..."
  local i
  for i in $(seq 1 60); do
    if curl -fsS --max-time 2 "$BACKEND_URL/health" >/dev/null 2>&1; then
      echo "Backend listo."
      return 0
    fi
    sleep 1
  done
  echo "El backend no respondió en $BACKEND_URL/health." >&2
  return 1
}

update_env_file() {
  local file="$1" url="$2" tmp
  mkdir -p "$(dirname "$file")"
  touch "$file"
  tmp="$(mktemp "${file}.XXXXXX")"
  URL="$url" awk '
    BEGIN { found = 0 }
    /^EXPO_PUBLIC_API_URL=/ {
      print "EXPO_PUBLIC_API_URL=" ENVIRON["URL"]
      found = 1
      next
    }
    { print }
    END {
      if (!found) {
        print "EXPO_PUBLIC_API_URL=" ENVIRON["URL"]
      }
    }
  ' "$file" > "$tmp"
  mv "$tmp" "$file"
}

CLOUDFLARED="$(find_cloudflared)"
stop_tunnel

if [ "$START_DOCKER" -eq 1 ]; then
  start_backend
fi

echo "Abriendo túnel hacia $BACKEND_URL..."
: > "$LOG_FILE"

start_tunnel() {
  "$CLOUDFLARED" tunnel --no-autoupdate --url "$BACKEND_URL" >>"$LOG_FILE" 2>&1 &
  TUNNEL_PID=$!
  echo "$TUNNEL_PID" > "$PID_FILE"
}

wait_for_tunnel_url() {
  local url=""
  for _ in $(seq 1 120); do
    if ! kill -0 "$TUNNEL_PID" 2>/dev/null; then
      return 1
    fi
    url="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG_FILE" | head -n1 || true)"
    if [ -n "$url" ]; then
      printf '%s\n' "$url"
      return 0
    fi
    sleep 0.5
  done
  return 1
}

cleanup() {
  if [ -n "${TUNNEL_PID:-}" ] && kill -0 "$TUNNEL_PID" 2>/dev/null; then
    kill "$TUNNEL_PID" 2>/dev/null || true
    wait "$TUNNEL_PID" 2>/dev/null || true
  fi
  rm -f "$PID_FILE"
}

TUNNEL_PID=""
trap cleanup EXIT
trap 'exit 130' INT TERM

TUNNEL_URL=""
attempt=1
while [ "$attempt" -le "$TUNNEL_ATTEMPTS" ]; do
  if [ "$attempt" -gt 1 ]; then
    echo "Reintentando túnel ($attempt/$TUNNEL_ATTEMPTS)..." >&2
    printf -- '--- reintento %s ---\n' "$attempt" >>"$LOG_FILE"
    sleep 2
  fi

  start_tunnel
  if TUNNEL_URL="$(wait_for_tunnel_url)"; then
    break
  fi

  echo "cloudflared no respondió (intento $attempt/$TUNNEL_ATTEMPTS)." >&2
  kill "$TUNNEL_PID" 2>/dev/null || true
  wait "$TUNNEL_PID" 2>/dev/null || true
  TUNNEL_PID=""
  TUNNEL_URL=""
  attempt=$((attempt + 1))
done

if [ -z "$TUNNEL_URL" ]; then
  echo "No se pudo obtener la URL del túnel tras $TUNNEL_ATTEMPTS intento(s). Log:" >&2
  cat "$LOG_FILE" >&2
  exit 1
fi

update_env_file "$ENV_FILE" "$TUNNEL_URL"

echo
echo "URL del backend: $TUNNEL_URL"
echo "Health:          $TUNNEL_URL/health"
echo "Actualizado:     $ENV_FILE"
echo
echo "Túnel activo (PID $TUNNEL_PID). Ctrl+C para cerrarlo."
echo "Si Metro ya estaba corriendo, reinícialo para tomar la nueva URL:"
echo "  cd frontend-mobile && $EXPO_CMD"
echo

if [ "$START_EXPO" -eq 1 ]; then
  read -r -a expo_argv <<< "$EXPO_CMD" || true
  if [ "$CLEAR_CACHE" -eq 1 ]; then
    expo_argv+=(--clear)
  fi
  echo "Iniciando Expo: ${expo_argv[*]}"
  (cd "$ROOT_DIR/frontend-mobile" && "${expo_argv[@]}")
else
  wait "$TUNNEL_PID" || true
fi
