#!/bin/bash
set -euo pipefail

ENV=$1
echo "🚀 Starting deployment..."

echo ""
echo "=== Phase 1: Deploying cert-manager namespace and Helm chart ==="
export PULUMI_SKIP_SECRET_COPY=true
pulumi up --yes --skip-preview

echo ""
echo "Waiting 90 seconds for Helm chart to create all resources..."
sleep 90

echo ""
echo "=== Waiting for cert-manager deployments to exist ==="
TIMEOUT=300
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    if kubectl get deployment cert-manager -n cert-manager &>/dev/null; then
        echo "✅ cert-manager deployment exists!"
        break
    fi
    echo "⏳ Waiting for cert-manager deployment... ($ELAPSED/$TIMEOUT seconds)"
    kubectl get all -n cert-manager
    sleep 15
    ELAPSED=$((ELAPSED + 15))
done

echo ""
echo "=== Waiting for cert-manager to be ready ==="
kubectl wait --for=condition=Available deployment/cert-manager -n cert-manager --timeout=5m
kubectl wait --for=condition=Available deployment/cert-manager-webhook -n cert-manager --timeout=5m
kubectl wait --for=condition=Available deployment/cert-manager-cainjector -n cert-manager --timeout=5m

echo ""
echo "=== Waiting for webhook ==="
sleep 40

echo ""
echo "=== Phase 2: Deploying ClusterIssuers and Certificate ==="

pulumi up --target "urn:pulumi:stage::infra::kubernetes:cert-manager.io/v1:ClusterIssuer::letsencrypt" \
          --target "urn:pulumi:stage::infra::kubernetes:cert-manager.io/v1:ClusterIssuer::letsencrypt-test" \
          --target "urn:pulumi:stage::infra::kubernetes:cert-manager.io/v1:Certificate::tls-cert" \
          --yes --skip-preview

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

# echo ""
# echo "=== Phase 3: Deploying $ENV services (without secret copy) ==="
# export PULUMI_SKIP_SECRET_COPY=true

# if [ "$ENV" = "all" ]; then
#     pulumi up --target "urn:pulumi:stage::infra::kubernetes:core/v1:Namespace::backend-service-dev" \
#               --target "urn:pulumi:stage::infra::custom:traefik:Middleware::backend-https-redirect-dev" \
#               --target "urn:pulumi:stage::infra::custom:traefik:Middleware::backend-cors-dev" \
#               --target "urn:pulumi:stage::infra::custom:traefik:Middleware::backend-rate-limit-dev" \
#               --target "urn:pulumi:stage::infra::kubernetes:apps/v1:Deployment::backend-dev" \
#               --target "urn:pulumi:stage::infra::kubernetes:core/v1:Service::backend-svc-dev" \
#               --target "urn:pulumi:stage::infra::kubernetes:networking.v1:Ingress::backend-ingress-dev" \
#               --yes --skip-preview || true
    
#     pulumi up --target "urn:pulumi:stage::infra::kubernetes:core/v1:Namespace::backend-service-demo" \
#               --target "urn:pulumi:stage::infra::custom:traefik:Middleware::backend-https-redirect-demo" \
#               --target "urn:pulumi:stage::infra::custom:traefik:Middleware::backend-cors-demo" \
#               --target "urn:pulumi:stage::infra::custom:traefik:Middleware::backend-rate-limit-demo" \
#               --target "urn:pulumi:stage::infra::kubernetes:apps/v1:Deployment::backend-demo" \
#               --target "urn:pulumi:stage::infra::kubernetes:core/v1:Service::backend-svc-demo" \
#               --target "urn:pulumi:stage::infra::kubernetes:networking.v1:Ingress::backend-ingress-demo" \
#               --yes --skip-preview || true
# else
#     pulumi up --target "urn:pulumi:stage::infra::kubernetes:core/v1:Namespace::backend-service-$ENV" \
#               --target "urn:pulumi:stage::infra::custom:traefik:Middleware::backend-https-redirect-$ENV" \
#               --target "urn:pulumi:stage::infra::custom:traefik:Middleware::backend-cors-$ENV" \
#               --target "urn:pulumi:stage::infra::custom:traefik:Middleware::backend-rate-limit-$ENV" \
#               --target "urn:pulumi:stage::infra::kubernetes:apps/v1:Deployment::backend-$ENV" \
#               --target "urn:pulumi:stage::infra::kubernetes:core/v1:Service::backend-svc-$ENV" \
#               --target "urn:pulumi:stage::infra::kubernetes:networking.v1:Ingress::backend-ingress-$ENV" \
#               --yes --skip-preview || true
# fi

# echo ""
# echo "=== Phase 4: Copying TLS secrets to namespaces ==="
# unset PULUMI_SKIP_SECRET_COPY

# if [ "$ENV" = "all" ]; then
#     pulumi up --target "urn:pulumi:stage::infra::kubernetes:core/v1:Secret::backend-tls-secret-dev" --yes --skip-preview
#     pulumi up --target "urn:pulumi:stage::infra::kubernetes:core/v1:Secret::backend-tls-secret-demo" --yes --skip-preview
# else
#     pulumi up --target "urn:pulumi:stage::infra::kubernetes:core/v1:Secret::backend-tls-secret-$ENV" --yes --skip-preview
# fi

echo ""
echo "✅ Deployment complete for $ENV!"