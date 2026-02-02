#!/bin/bash
set -euo pipefail

ENV=$1

echo "🚀 Starting deployment for: $ENV"

echo ""
echo "=== Phase 1: Deploying cert-manager ==="
export PULUMI_SKIP_SECRET_COPY=true
pulumi up --target '*cert-manager*' --yes --skip-preview || true

echo ""
echo "=== Waiting for cert-manager ==="
TIMEOUT=180
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    if kubectl get deployment cert-manager -n cert-manager &>/dev/null; then
        echo "✅ cert-manager exists!"
        break
    fi
    echo "⏳ Waiting... ($ELAPSED/$TIMEOUT seconds)"
    sleep 5
    ELAPSED=$((ELAPSED + 5))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    echo "❌ cert-manager not found"
    exit 1
fi

kubectl wait --for=condition=Available deployment/cert-manager -n cert-manager --timeout=5m
kubectl wait --for=condition=Available deployment/cert-manager-webhook -n cert-manager --timeout=5m
kubectl wait --for=condition=Available deployment/cert-manager-cainjector -n cert-manager --timeout=5m

echo ""
echo "=== Waiting for webhook ==="
sleep 40

echo ""
echo "=== Phase 2: Deploying ClusterIssuers, Certificate, and $ENV services ==="

if [ "$ENV" = "all" ]; then
    pulumi up --target "*letsencrypt*" --target "*tls-cert*" \
              --target "*backend-dev*" --target "*backend-demo*" \
              --yes --skip-preview || true
elif [ "$ENV" = "dev" ]; then
    pulumi up --target "*letsencrypt*" --target "*tls-cert*" \
              --target "*backend-dev*" \
              --yes --skip-preview || true
else
    pulumi up --target "*letsencrypt*" --target "*tls-cert*" \
              --target "*backend-demo*" \
              --yes --skip-preview || true
fi

echo ""
echo "=== Waiting for certificate ==="
TIMEOUT=120
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    if kubectl get certificate tls-cert -n cert-manager &>/dev/null; then
        echo "✅ Certificate exists!"
        break
    fi
    echo "⏳ Waiting... ($ELAPSED/$TIMEOUT seconds)"
    sleep 5
    ELAPSED=$((ELAPSED + 5))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    echo "❌ Certificate not created"
    exit 1
fi

kubectl wait --for=condition=Ready certificate/tls-cert -n cert-manager --timeout=10m || {
    echo "❌ Certificate failed"
    kubectl describe certificate tls-cert -n cert-manager
    kubectl get certificaterequest -n cert-manager
    kubectl get challenges -n cert-manager
    kubectl describe challenge -n cert-manager 2>/dev/null || true
    exit 1
}

echo "✅ Certificate ready!"

echo ""
echo "=== Phase 3: Copying TLS secrets to namespaces ==="
unset PULUMI_SKIP_SECRET_COPY

if [ "$ENV" = "all" ]; then
    pulumi up --target "*backend-dev*" --target "*frontend-dev*" \
              --target "*backend-demo*" --target "*frontend-demo*" \
              --yes --skip-preview
elif [ "$ENV" = "dev" ]; then
    pulumi up --target "*backend-dev*" --target "*frontend-dev*" \
              --yes --skip-preview
else
    pulumi up --target "*backend-demo*" --target "*frontend-demo*" \
              --yes --skip-preview
fi

echo ""
echo "✅ Deployment complete for $ENV!"