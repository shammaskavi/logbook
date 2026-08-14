#!/usr/bin/env bash
#
# Export the remote Postgres schema into supabase/schema.sql
#
#   ./scripts/dump-schema.sh
#
# Read-only: --schema-only reads structure, never table data, and never writes
# to the database. The password is read without echoing and is never written to
# your shell history.
#
# The database password is NOT your Supabase account password. If you don't
# have it, reset it at:
#   Dashboard -> Project Settings -> Database -> Database password
# Resetting only affects direct Postgres connections; the app uses the anon
# key and keeps working.

set -uo pipefail

PROJECT_REF="pwdadqeyjansfkmxzgtu"
OUT="supabase/schema.sql"

cd "$(dirname "$0")/.." || exit 1

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump not found. Install it with:"
  echo "    brew install libpq && brew link --force libpq"
  exit 1
fi

echo "Postgres database password for project ${PROJECT_REF}"
echo "(input is hidden — nothing is echoed or saved)"
printf "Password: "
read -rs DB_PASSWORD
echo
echo

if [ -z "$DB_PASSWORD" ]; then
  echo "No password entered; aborting."
  exit 1
fi

# Supabase exposes several connection endpoints and which one works depends on
# the project's region and whether it has IPv4. Try each until one connects.
HOSTS=(
  "aws-0-ap-south-1.pooler.supabase.com|postgres.${PROJECT_REF}|5432"
  "aws-1-ap-south-1.pooler.supabase.com|postgres.${PROJECT_REF}|5432"
  "db.${PROJECT_REF}.supabase.co|postgres|5432"
)

mkdir -p supabase

for entry in "${HOSTS[@]}"; do
  IFS='|' read -r HOST USER PORT <<< "$entry"
  echo "Trying ${HOST} ..."

  if PGPASSWORD="$DB_PASSWORD" PGCONNECT_TIMEOUT=15 pg_dump \
      -h "$HOST" -p "$PORT" -U "$USER" -d postgres \
      --schema-only --no-owner --no-privileges --schema=public \
      > "$OUT" 2>/tmp/dump-schema-error.txt; then

    if [ -s "$OUT" ]; then
      echo
      echo "Success — schema written to ${OUT} ($(wc -l < "$OUT" | tr -d ' ') lines)"
      unset DB_PASSWORD
      exit 0
    fi
  fi

  echo "  failed: $(tail -1 /tmp/dump-schema-error.txt)"
done

unset DB_PASSWORD
rm -f "$OUT"

echo
echo "None of the endpoints worked. The last error is above."
echo "Copy the exact 'Session pooler' connection string from"
echo "Dashboard -> Connect, and send it over (without the password)."
exit 1
