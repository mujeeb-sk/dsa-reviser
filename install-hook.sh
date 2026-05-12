#!/bin/sh
#
# install-hook.sh — Installs a post-commit hook in the DSA repo
# that auto-runs sync.js whenever you commit new problems.
#
# Usage:  node install-hook.js
# Or:     chmod +x install-hook.sh && ./install-hook.sh

DSA_REPO="${1:-../DSA}"
REVISER_DIR="$(cd "$(dirname "$0")" && pwd)"

HOOK_FILE="$DSA_REPO/.git/hooks/post-commit"

cat > "$HOOK_FILE" << EOF
#!/bin/sh
# Auto-sync DSA problems to dsa-reviser
echo "🔄 Syncing DSA problems to dsa-reviser..."
cd "$REVISER_DIR" && node sync.js "$DSA_REPO" 2>&1
echo "✅ Sync complete."
EOF

chmod +x "$HOOK_FILE"
echo "✅ Installed post-commit hook at: $HOOK_FILE"
echo "   Every commit in the DSA repo will now auto-sync to dsa-reviser."
