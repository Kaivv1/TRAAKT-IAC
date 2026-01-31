#!/bin/bash
set -euo pipefail

echo "🚀 Starting deployment..."
export PULUMI_SKIP_SECRET_COPY=true

echo ""
echo "=== Phase 1: Deploying all infrastructure ==="
pulumi up --yes --skip-preview || true

echo ""
echo "=== Waiting for cert-manager deployments to exist ===
"
TIMEOUT=180
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    if kubectl get deployment cert-manager -n cert-manager &>/dev/null; then
        echo "✅ cert-manager exists!"
        break
    fi
    echo "⏳ Waiting for cert-manager deployment... ($ELAPSED/$TIMEOUT seconds)"
    sleep 5
    ELAPSED=$((ELAPSED + 5))
done

echo ""
echo "=== Waiting for cert-manager to be ready ==="
kubectl wait --for=condition=Available deployment/cert-manager -n cert-manager --timeout=5m
kubectl wait --for=condition=Available deployment/cert-manager-webhook -n cert-manager --timeout=5m
kubectl wait --for=condition=Available deployment/cert-manager-cainjector -n cert-manager --timeout=5m

echo ""
echo "=== Waiting for webhook to be fully ready ==="
echo "Giving webhook time to generate certificates..."
sleep 30

echo "Testing webhook readiness..."
TIMEOUT=60
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    if kubectl get validatingwebhookconfigurations cert-manager-webhook &>/dev/null; then
        echo "✅ Webhook configuration exists!"
        sleep 10  # Extra buffer to ensure webhook is accepting requests
        break
    fi
    echo "⏳ Waiting for webhook... ($ELAPSED/$TIMEOUT seconds)"
    sleep 5
    ELAPSED=$((ELAPSED + 5))
done

echo ""
echo "=== Deploying again to create ClusterIssuers and Certificate ==="
export PULUMI_SKIP_SECRET_COPY=true
pulumi up --yes --skip-preview || true

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

if [ $ELAPSED -ge $TIMEOUT ]; then
    echo "❌ Certificate resource not created"
    exit 1
fi

kubectl wait --for=condition=Ready certificate/tls-cert -n cert-manager --timeout=10m || {
    echo "❌ Certificate failed. Checking details..."
    kubectl describe certificate tls-cert -n cert-manager
    kubectl get challenges -n cert-manager
    kubectl describe challenge -n cert-manager 2>/dev/null || echo "No challenges found"
    exit 1
}

echo "✅ Certificate ready!"

echo ""
echo "=== Phase 2: Deploying services ==="
unset PULUMI_SKIP_SECRET_COPY
pulumi up --yes --skip-preview

echo ""
echo "✅ Deployment complete!"