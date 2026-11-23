#!/bin/sh
# Build a small single-purpose preview page: core + your own src files only (no other agents' files).
#   sh tools/fig-preview.sh <name> sub-m05-6.js [more files in src/]
# Writes proto/p-<name>.html and prints the URL. The local preview server must be running (port 8765);
# open  http://localhost:8765/proto/p-<name>.html#<article-id>  in your OWN browser tab (tabs_create, then navigate).
cd "$(dirname "$0")/.." || exit 1
name="$1"; shift
[ -z "$name" ] && { echo "usage: sh tools/fig-preview.sh <name> <src files...>"; exit 1; }
out="proto/p-$name.html"
{
  echo '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>[hidden]{display:none!important}</style>'
  cat src/head.html
  echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/11.6.0/mermaid.min.js"></script>'
  echo '<script>'
  for f in src/core.js "$@"; do case "$f" in src/*) p="$f";; *) p="src/$f";; esac; [ "$p" = "src/src/core.js" ] && continue; sed 's#</script#<\\/script#g' "$p"; echo; done
  sed 's#</script#<\\/script#g' proto/mini-boot.js
  echo '</script>'
} > "$out"
echo "built $out  ->  http://localhost:8765/$out#<article-id>"
