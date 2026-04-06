set -eu

echo "Running local verification for ROSE-SEIN"
npm run build
npm run typecheck
echo "Local verification completed"

