#!/bin/bash
set -euo pipefail

echo "🚀 Starting deployment..."
export PULUMI_SKIP_SECRET_COPY=true

echo ""
echo "=== Phase 1: Deploying all infrastructure ==="
pulumi up --yes --skip-preview || true

echo ""
echo "=== Waiting for cert-manager deployments to exist ==="
TIMEOUT=180
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    if kubectl get deployment cert-manager -n cert-manager &>/dev/null; then
        echo "✅ cert-manager deployment exists!"
        break
    fi
    echo "⏳ Waiting for cert-manager deployment... ($ELAPSED/$TIMEOUT seconds)"
    sleep 5
    ELAPSED=$((ELAPSED + 5))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    echo "❌ cert-manager deployment not created after $TIMEOUT seconds"
    echo "Checking what exists in cert-manager namespace:"
    kubectl get all -n cert-manager
    exit 1
fi

echo ""
echo "=== Waiting for cert-manager to be ready ==="
kubectl wait --for=condition=Available deployment/cert-manager -n cert-manager --timeout=5m
kubectl wait --for=condition=Available deployment/cert-manager-webhook -n cert-manager --timeout=5m
kubectl wait --for=condition=Available deployment/cert-manager-cainjector -n cert-manager --timeout=5m

echo ""
echo "=== Waiting for certificate to be ready ==="
TIMEOUT=60
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    if kubectl get certificate tls-cert -n cert-manager &>/dev/null; then
        echo "✅ Certificate resource exists!"
        break
    fi
    echo "⏳ Waiting for certificate resource... ($ELAPSED/$TIMEOUT seconds)"
    sleep 5
    ELAPSED=$((ELAPSED + 5))
done

kubectl wait --for=condition=Ready certificate/tls-cert -n cert-manager --timeout=10m

echo ""
echo "=== Phase 2: Deploying services ==="
unset PULUMI_SKIP_SECRET_COPY
pulumi up --yes --skip-preview

echo ""
echo "✅ Deployment complete!"