#!/bin/bash
# Usage: ./release.sh v1.0.0 "Release message"

VERSION="${1:?Usage: ./release.sh v1.0.0 \"Release message\"}"
MSG="${2:-Release $VERSION}"

# Safety: only commit tracked files
git add -u
git commit -m "$MSG" --allow-empty
git tag -a "$VERSION" -m "$MSG"
git push origin main --tags
echo "✅ Released $VERSION"
