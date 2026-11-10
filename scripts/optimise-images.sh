#!/usr/bin/env bash
# Development-only: ImageMagick with WebP support. Originals stay untouched.
set -euo pipefail
cd "$(dirname "$0")/.."
for source in art/*.jpg thumbs/*.jpg; do
  magick "$source" -strip -define webp:method=6 -quality 82 "${source%.jpg}.webp"
done
