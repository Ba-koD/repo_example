#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "usage: ./scripts/use-env.sh <dev|stage|prod>" >&2
  exit 1
fi

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname "$0")" && pwd)"
APP_ROOT="$(dirname "$SCRIPT_DIR")"
SOURCE_FILE="$APP_ROOT/.env.$1"
TARGET_FILE="$APP_ROOT/.env"

if [ ! -f "$SOURCE_FILE" ]; then
  echo "unknown environment: $1" >&2
  exit 1
fi

cp "$SOURCE_FILE" "$TARGET_FILE"
echo "selected $(basename "$SOURCE_FILE") -> .env"

