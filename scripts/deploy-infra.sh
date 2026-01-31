
#!/bin/bash

set -euo pipefail

STACK="stage"
PROJECT="infra"

echo "=== Phase 1: Infrastructure ==="

echo "Deploying cert-manager namespace..."
pulumi up --target "urn:pulumi:${STACK}::${PROJECT}::kubernetes:core/v1:Namespace::cert-manager" --yes --skip-preview

echo "Deploying cert-manager Helm chart..."
pulumi up --target "urn:pulumi:${STACK}::${PROJECT}::kubernetes:helm.sh/v3:Chart::cert-manager" --yes --skip-preview

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

TIMEOUT=600
ELAPSED=0
INTERVAL=10

while [ $ELAPSED -lt $TIMEOUT ]; do
    READY=$(kubectl get certificate tls-cert -n cert-manager -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>/dev/null || echo "False")
    
    if [ "$READY" = "True" ]; then
        echo "✅ Certificate is ready!"
        
        if kubectl get secret tls-cert-secret -n cert-manager &>/dev/null; then
            echo "✅ TLS secret exists!"
            break
        else
            echo "⚠️ Certificate ready but secret not found yet..."
        fi
    else
        echo "⏳ Certificate not ready yet... ($ELAPSED/$TIMEOUT seconds elapsed)"
    fi
    
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    echo "❌ Certificate not ready after $TIMEOUT seconds"
    echo "Certificate details:"
    kubectl describe certificate tls-cert -n cert-manager
    exit 1
fi

echo ""
echo "=== Phase 2: Deploy Everything Else ==="
pulumi up --yes --skip-preview

echo ""
echo "✅ Deployment complete!"