#!/bin/bash
set -euo pipefail

STACK="stage"
PROJECT="infra"

echo "=== Phase 1: Infrastructure ==="
export PULUMI_SKIP_SECRET_COPY=true

pulumi up --target "urn:pulumi:${STACK}::${PROJECT}::kubernetes:core/v1:Namespace::cert-manager" --yes --skip-preview
pulumi up --target "urn:pulumi:${STACK}::${PROJECT}::kubernetes:helm.sh/v3:Chart::cert-manager" --yes --skip-preview
pulumi up --target "urn:pulumi:${STACK}::${PROJECT}::kubernetes:batch/v1:Job::wait-cert-manager" --yes --skip-preview
pulumi up \
  --target "urn:pulumi:${STACK}::${PROJECT}::kubernetes:cert-manager.io/v1:ClusterIssuer::letsencrypt" \
  --target "urn:pulumi:${STACK}::${PROJECT}::kubernetes:cert-manager.io/v1:ClusterIssuer::letsencrypt-test" \
  --yes --skip-preview
pulumi up --target "urn:pulumi:${STACK}::${PROJECT}::kubernetes:cert-manager.io/v1:Certificate::tls-cert" --yes --skip-preview

echo ""
echo "=== Waiting for Certificate ==="
kubectl wait --for=condition=Ready certificate/tls-cert -n cert-manager --timeout=4m

echo ""
echo "=== Phase 2: Deploy Services ==="
unset PULUMI_SKIP_SECRET_COPY  
pulumi up --yes --skip-preview

echo ""
echo "✅ Deployment complete!"