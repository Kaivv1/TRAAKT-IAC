#!/bin/bash
set -euo pipefail

ENV=$1
echo "🚀 Starting deployment..."

export PULUMI_SKIP_SECRET_COPY=true
pulumi config set environment "${ENV}"
pulumi up --yes --skip-preview

echo ""
echo "Waiting for cert-manager to be available..."
kubectl wait --for=condition=Available deployment/cert-manager -n cert-manager --timeout=5m
kubectl wait --for=condition=Available deployment/cert-manager-webhook -n cert-manager --timeout=5m
kubectl wait --for=condition=Available deployment/cert-manager-cainjector -n cert-manager --timeout=5m

echo ""
echo "Give 40s for the webhook..."
sleep 40

echo ""
echo "Waiting for certificate to be ready..."
kubectl wait --for=condition=Ready certificate/tls-cert -n cert-manager --timeout=6m || {
    echo "❌ Certificate failed"
    kubectl describe certificate tls-cert -n cert-manager
    kubectl get certificaterequest -n cert-manager
    kubectl get challenges -n cert-manager
    kubectl describe challenge -n cert-manager 2>/dev/null || true
    exit 1
}
echo "✅ Certificate ready!"

echo ""
echo "Copying certificate secret in namespaces for ingress..."
unset PULUMI_SKIP_SECRET_COPY
pulumi config set environment "${ENV}"
pulumi up --yes --no-preview

echo ""
echo "✅ Deployment complete for ${ENV}!"