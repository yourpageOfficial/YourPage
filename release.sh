#!/bin/bash
# Usage: ./release.sh v1.0.0 "Initial release"

VERSION="${1:?Usage: ./release.sh v1.0.0 \"Release message\"}"
MSG="${2:-Release $VERSION}"

git add -A
git commit -m "$MSG" --allow-empty
git tag -a "$VERSION" -m "$MSG"
git push origin main --tags
echo "✅ Released $VERSION — GitHub Actions will deploy automatically"
