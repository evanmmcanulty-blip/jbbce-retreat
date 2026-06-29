#!/usr/bin/env bash
# Deploy ONE Firebase target with retries for the transient errors that kept
# silently dropping deploys:
#   - hosting "is the current active version" — an idempotent no-op, treat as success
#   - functions "unable to queue the operation" / HTTP 409 — a concurrent op was
#     still settling; back off and retry
# Usage: deploy-target.sh <target>   e.g. deploy-target.sh functions
set -uo pipefail

target="$1"
max=4

for attempt in $(seq 1 "$max"); do
  echo "::group::firebase deploy --only $target (attempt $attempt/$max)"
  out=$(firebase deploy --only "$target" --token "$FIREBASE_TOKEN" --project provincetown-2026 2>&1)
  code=$?
  echo "$out"
  echo "::endgroup::"

  if [ "$code" -eq 0 ]; then
    echo "✓ $target deployed"
    exit 0
  fi

  # Idempotent no-op: hosting refused because this exact build is already live.
  if echo "$out" | grep -qi "is the current active version"; then
    echo "✓ $target already at the live version (no-op) — treating as success"
    exit 0
  fi

  # Transient: a concurrent operation was queued (classic functions 409 race).
  if echo "$out" | grep -qiE "unable to queue the operation|HTTP Error: 409|try again|simultaneously"; then
    wait=$((attempt * 25))
    echo "⚠ transient error on $target — retrying in ${wait}s"
    sleep "$wait"
    continue
  fi

  echo "✗ $target failed with a non-transient error"
  exit "$code"
done

echo "✗ $target still failing after $max attempts"
exit 1
