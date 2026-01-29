#!/bin/bash

set -euo pipefail

MASTER_IP=$1
AGENT_IPS_STR=$2
SSH_USER=$3

IFS=',' read -ra AGENT_IPS <<< "$AGENT_IPS_STR"

get_reservation_calculations() {
cat << 'EOF'
    #!/bin/bash
    echo "Calculating variables..."
    TOTAL_CPU=$(nproc)
    TOTAL_MEM_MI=$(($(grep MemTotal /proc/meminfo | awk '{print $2}') / 1024))

    export KUBE_CPU=$((TOTAL_CPU * 1000 * 75 / 1000))
    export SYSTEM_CPU=$((TOTAL_CPU * 1000 * 75 / 1000))
    export KUBE_MEM=$((TOTAL_MEM_MI * 75 / 1000))
    export SYSTEM_MEM=$((TOTAL_MEM_MI * 75 / 1000))
    export EVICTION_MEM=$((TOTAL_MEM_MI * 5 / 100))

    echo "${TOTAL_CPU} cores, ${TOTAL_MEM_MI}Mi | Reserved: $((KUBE_CPU+SYSTEM_CPU))m, $((KUBE_MEM+SYSTEM_MEM))Mi (15%)"
EOF
}

echo "Installing k3s master server..."
ssh $SSH_USER@$MASTER_IP bash << ENDSSH
    $(get_reservation_calculations)
    curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="server \
        --node-name=master
        --kube-apiserver-arg=oidc-issuer-url=https://token.actions.githubusercontent.com \
        --kube-apiserver-arg=oidc-client-id=https://kubernetes.default.svc.cluster.local \
        --kube-apiserver-arg=oidc-username-claim=sub \
        --kube-apiserver-arg=oidc-username-prefix=github: \
        --kube-apiserver-arg=oidc-groups-claim=groups \
        --kubelet-arg=kube-reserved=cpu=\${KUBE_CPU}m,memory=\${KUBE_MEM}Mi \
        --kubelet-arg=system-reserved=cpu=\${SYSTEM_CPU}m,memory=\${SYSTEM_MEM}Mi \
        --kubelet-arg=eviction-hard=memory.available<\${EVICTION_MEM}Mi,nodefs.available<10%" sh -
    sleep 5
ENDSSH
echo "Master server is installed"

echo "Retrieving token..."
TOKEN=$(ssh $SSH_USER@$MASTER_IP "cat /var/lib/rancher/k3s/server/node-token")
echo "Token retrieved"

install_agent() {
    local NODE_IP=$1
    local NODE_NAME=$2

    echo "Installing k3s agent $NODE_NAME..."

    ssh $SSH_USER@$NODE_IP bash << ENDSSH
    $(get_reservation_calculations)
    curl -sfL https://get.k3s.io | K3S_URL=https://$MASTER_IP:6443 \
        K3S_TOKEN=$TOKEN \
        INSTALL_K3S_EXEC="agent \
            --node-name=${NODE_NAME} \
            --kubelet-arg=kube-reserved=cpu=\${KUBE_CPU}m,memory=\${KUBE_MEM}Mi \
            --kubelet-arg=system-reserved=cpu=\${SYSTEM_CPU}m,memory=\${SYSTEM_MEM}Mi \
            --kubelet-arg=eviction-hard=memory.available<\${EVICTION_MEM}Mi,nodefs.available<10%" sh -
    sleep 5
ENDSSH

    echo "$NODE_NAME agent is installed and joined master server"
}

for i in "${!AGENT_IPS[@]}"; do
    NAME="node$(printf '%02d' $((i+1)))"
    NODE_IP="${AGENT_IPS[$i]}"

    install_agent $NODE_IP $NAME
done

echo "Creating pulumi state folder..."
if ssh $SSH_USER:$MASTER_IP "mkdir -p /var/pulumi/state"; then
    echo "Pulumi state folder created"
else
    echo "Failed to create pulumi state folder"
fi

echo "Cluster setup is ready"