#!/bin/sh
# =============================================================================
# PERSONAL CONTEXT SYSTEM - Docker Entrypoint Script
# =============================================================================
# Database readiness and migrations are handled by Docker Compose
# (db healthcheck + separate `migrate` service). This script only starts the app.
# =============================================================================

set -e

echo "Personal Context System - Starting..."
echo "------------------------------------------"

exec "$@"
