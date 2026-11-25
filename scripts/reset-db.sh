#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"

COMPOSE="${COMPOSE:-docker compose}"
DB_SERVICE="${DB_SERVICE:-db}"
BACKEND_SERVICE="${BACKEND_SERVICE:-backend}"
POSTGRES_USER="${POSTGRES_USER:-finanzas}"
POSTGRES_DB="${POSTGRES_DB:-finanzas_familiares}"

YES=0
MIGRATE=1
DROP_VOLUME=0

usage() {
  cat <<'EOF'
Uso: scripts/reset-db.sh [opciones]

Elimina todos los datos de PostgreSQL y deja la base como nueva,
reaplicando las migraciones de Alembic.

Opciones:
  -y, --yes            No pedir confirmación.
  --no-migrate         Solo vaciar la base, sin reaplicar migraciones.
  --volume             Eliminar también el volumen de Docker (down -v).
                       La base se recrea desde cero y se migra.
  -h, --help           Muestra esta ayuda.

Variables de entorno:
  COMPOSE              Comando de Compose (por defecto: "docker compose").
  DB_SERVICE           Servicio de PostgreSQL (por defecto: db).
  BACKEND_SERVICE      Servicio del backend (por defecto: backend).
  POSTGRES_USER        Usuario de la base (por defecto: finanzas).
  POSTGRES_DB          Nombre de la base (por defecto: finanzas_familiares).

Ejemplos:
  scripts/reset-db.sh              # pide confirmación y reaplica migraciones
  scripts/reset-db.sh -y           # sin confirmación
  scripts/reset-db.sh -y --volume  # borra el volumen completo
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    -y|--yes) YES=1 ;;
    --no-migrate) MIGRATE=0 ;;
    --volume) DROP_VOLUME=1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Opción desconocida: $1" >&2; usage >&2; exit 1 ;;
  esac
  shift
done

run_compose() {
  # shellcheck disable=SC2086
  (cd "$ROOT_DIR" && $COMPOSE "$@")
}

require_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "Error: docker no está instalado o no está en el PATH." >&2
    exit 1
  fi
}

wait_for_db() {
  echo "Esperando a que PostgreSQL esté listo..."
  for _ in $(seq 1 60); do
    if run_compose exec -T "$DB_SERVICE" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
      echo "PostgreSQL listo."
      return 0
    fi
    sleep 1
  done
  echo "Error: PostgreSQL no respondió a tiempo." >&2
  exit 1
}

confirm() {
  if [ "$YES" -eq 1 ]; then
    return 0
  fi
  echo "Esto ELIMINARÁ TODOS LOS DATOS de la base '$POSTGRES_DB'."
  if [ "$DROP_VOLUME" -eq 1 ]; then
    echo "Además se borrará el volumen de Docker (down -v)."
  fi
  printf "¿Continuar? [s/N] "
  read -r answer
  case "$answer" in
    s|S|si|Si|SI|y|Y|yes|Yes) ;;
    *) echo "Cancelado."; exit 0 ;;
  esac
}

reset_volume() {
  echo "Eliminando contenedores y volumen de datos..."
  run_compose down -v
  echo "Levantando PostgreSQL..."
  run_compose up -d "$DB_SERVICE"
  wait_for_db
}

reset_schema() {
  echo "Vaciando la base de datos (schema public)..."
  run_compose exec -T "$DB_SERVICE" psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    -c "DROP SCHEMA IF EXISTS public CASCADE;" \
    -c "CREATE SCHEMA public;" \
    -c "GRANT ALL ON SCHEMA public TO \"$POSTGRES_USER\";" \
    -c "GRANT ALL ON SCHEMA public TO public;"
}

migrate() {
  echo "Reaplicando migraciones..."
  run_compose run --rm --no-deps "$BACKEND_SERVICE" alembic upgrade head
}

require_docker
confirm

if [ "$DROP_VOLUME" -eq 1 ]; then
  reset_volume
else
  echo "Levantando PostgreSQL..."
  run_compose up -d "$DB_SERVICE"
  wait_for_db
  reset_schema
fi

if [ "$MIGRATE" -eq 1 ]; then
  migrate
fi

echo "Listo: la base de datos quedó desde cero."
