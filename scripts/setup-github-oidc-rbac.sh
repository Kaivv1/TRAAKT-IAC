#!/bin/bash

set -euo pipefail

MASTER_IP=$1
SSH_USER=$2
GITHUB_ORG=$3
GITHUB_REPO=$4

cat << EOF > /tmp/github-oidc-rbac.yaml
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: github-actions-deployer
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["*"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: github-actions-deployer
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: github-actions-deployer
subjects:
- kind: User
  name: "github:repo:${GITHUB_ORG}/${GITHUB_REPO}:ref:refs/heads/main"
  apiGroup: rbac.authorization.k8s.io
EOF

echo "Copying RBAC configuration to master node..."
scp /tmp/github-oidc-rbac.yaml $SSH_USER@$MASTER_IP:/tmp/

echo "Applying RBAC configuration..."
ssh $SSH_USER@$MASTER_IP "sudo kubectl apply -f /tmp/github-oidc-rbac.yaml"

echo "RBAC configuration applied successfully!"