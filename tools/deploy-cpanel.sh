#!/usr/bin/env bash
# Run on the existing cPanel account, from a tested checkout.
set -euo pipefail
SOURCE=$(cd "$(dirname "$0")/.." && pwd -P)
WEBROOT="$HOME/public_html"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
STAGE="$HOME/.dsv-stage-$STAMP"
BACKUP="$HOME/dsv-backup-$STAMP"
test -d "$WEBROOT" && test ! -L "$WEBROOT"
test ! -e "$STAGE" && test ! -e "$BACKUP"
python3 - "$SOURCE" <<'PY'
import hashlib, json, pathlib, sys
root = pathlib.Path(sys.argv[1])
files = json.loads((root/'docs/runtime-manifest.json').read_text())['files']
for item in files:
    data = (root/item['path']).read_bytes()
    assert len(data) == item['bytes'], item['path']
    assert hashlib.sha256(data).hexdigest() == item['sha256'], item['path']
print('Verified', len(files), 'runtime files before deployment.')
PY
# Preserve hosting configuration, certificate validation and other existing files.
cp -a "$WEBROOT" "$STAGE"
rsync -a "$SOURCE/dist/" "$STAGE/"
test -s "$STAGE/index.html" && test -s "$STAGE/modular-cafe.js"
mv "$WEBROOT" "$BACKUP"
if ! mv "$STAGE" "$WEBROOT"; then
  mv "$BACKUP" "$WEBROOT"
  exit 1
fi
chmod 700 "$BACKUP"
printf 'Published source: %s\nRollback directory: %s\n' "$(git -C "$SOURCE" rev-parse HEAD)" "$BACKUP"
