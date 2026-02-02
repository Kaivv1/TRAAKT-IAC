#!/bin/bash
set -euo pipefail

ENV=$1

echo "🚀 Starting deployment..."

echo ""
echo "=== Phase 1: Deploying cert-manager ==="
export PULUMI_SKIP_SECRET_COPY=true

pulumi up --target "urn:pulumi:stage::infra::kubernetes:core/v1:Namespace::cert-manager" --yes --skip-preview || true
pulumi up --target "urn:pulumi:stage::infra::kubernetes:helm.sh/v3:Chart::cert-manager" --yes --skip-preview || true
pulumi up --target "urn:pulumi:stage::infra::kubernetes:batch/v1:Job::wait-cert-manager" --yes --skip-preview || true

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

pulumi up --target urn:pulumi:stage::infra::kubernetes:cert-manager.io/v1:ClusterIssuer::letsencrypt --yes --skip-preview || true
pulumi up --target urn:pulumi:stage::infra::kubernetes:cert-manager.io/v1:ClusterIssuer::letsencrypt-test --yes --skip-preview || true
pulumi up --target urn:pulumi:stage::infra::kubernetes:cert-manager.io/v1:Certificate::tls-cert --yes --skip-preview || true

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
   # something
else
    pulumi up --target "urn:pulumi:stage::infra::kubernetes:core/v1:Namespace::backend-service-$ENV" --yes --skip-preview || true
    pulumi up --target "urn:pulumi:stage::infra::kubernetes:core/v1:Service::backend-svc-$ENV" --yes --skip-preview || true
    pulumi up --target "urn:pulumi:stage::infra::kubernetes:apps/v1:Deployment::backend-$ENV" --yes --skip-preview || true
    pulumi up --target "urn:pulumi:stage::infra::custom:traefik:Middleware::backend-https-redirect-$ENV" --yes --skip-preview || true
    pulumi up --target "urn:pulumi:stage::infra::custom:traefik:Middleware::backend-cors-$ENV" --yes --skip-preview || true
    pulumi up --target "urn:pulumi:stage::infra::custom:traefik:Middleware::backend-rate-limit-$ENV" --yes --skip-preview || true
    pulumi up --target "urn:pulumi:stage::infra::kubernetes:core/v1:Secret::backend-tls-secret-$ENV" --yes --skip-preview || true
    pulumi up --target "urn:pulumi:stage::infra::kubernetes:networking.v1:Ingress::backend-ingress-$ENV" --yes --skip-preview || true
fi

echo ""
echo "✅ Deployment complete for $ENV!"