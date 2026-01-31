#!/bin/bash
set -euo pipefail

STACK="stage"
PROJECT="infra"

echo "=== Phase 1: Infrastructure ==="
export PULUMI_SKIP_SECRET_COPY=true

echo "Deploying cert-manager namespace..."
pulumi up --target "urn:pulumi:${STACK}::${PROJECT}::kubernetes:core/v1:Namespace::cert-manager" --yes --skip-preview

echo "Deploying cert-manager Helm chart..."
pulumi up --target "urn:pulumi:${STACK}::${PROJECT}::kubernetes:helm.sh/v3:Chart::cert-manager" --yes --skip-preview

echo "Waiting for cert-manager to be ready..."
kubectl wait --for=condition=Available deployment/cert-manager -n cert-manager --timeout=5m
kubectl wait --for=condition=Available deployment/cert-manager-webhook -n cert-manager --timeout=5m
kubectl wait --for=condition=Available deployment/cert-manager-cainjector -n cert-manager --timeout=5m

echo "Waiting for CRDs to be registered..."
sleep 10 

echo "Deploying wait job..."
pulumi up --target "urn:pulumi:${STACK}::${PROJECT}::kubernetes:batch/v1:Job::wait-cert-manager" --yes --skip-preview

echo "Deploying ClusterIssuers..."
pulumi up \
  --target "urn:pulumi:${STACK}::${PROJECT}::kubernetes:cert-manager.io/v1:ClusterIssuer::letsencrypt" \
  --target "urn:pulumi:${STACK}::${PROJECT}::kubernetes:cert-manager.io/v1:ClusterIssuer::letsencrypt-test" \
  --yes --skip-preview

echo "Deploying Certificate..."
pulumi up --target "urn:pulumi:${STACK}::${PROJECT}::kubernetes:cert-manager.io/v1:Certificate::tls-cert" --yes --skip-preview

echo ""
echo "=== Waiting for Certificate ==="
echo "Waiting for certificate to be ready..."
kubectl wait --for=condition=Ready certificate/tls-cert -n cert-manager --timeout=10m

echo ""
echo "=== Phase 2: Deploy Services ==="
unset PULUMI_SKIP_SECRET_COPY
pulumi up --yes --skip-preview

echo ""
echo "✅ Deployment complete!"