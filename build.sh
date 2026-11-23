#!/bin/sh
# Concatenate src/ into one self-contained index.html
cd "$(dirname "$0")"
JS="src/core.js src/labs-a.js src/labs-b.js src/labs-c.js $(ls src/labs-m*.js 2>/dev/null) src/ch-intro.js src/ch-a.js src/ch-b.js src/ch-c.js src/ch-d.js $(ls src/sub-m*.js 2>/dev/null) $(ls src/stage-*.js 2>/dev/null) src/tail.js"
{
  cat src/head.html
  echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/11.6.0/mermaid.min.js"></script>'
  echo '<script>'
  for f in $JS; do sed 's#</script#<\\/script#g' "$f"; echo; done
  echo '</script>'
} > index.html
# Local preview copy with the charset/viewport the artifact skeleton adds at publish time
{ echo '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px -apple-system,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>'; cat index.html; } > preview.html
