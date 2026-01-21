#!/bin/bash

set -euo pipefail

MASTER_IP="${MASTER_IP}"
NODE1_IP="${NODE1_IP}"
NODE2_IP="${NODE2_IP}"
SSH_USER="${SSH_USER}"

destroy_node() {
    local IP=$1
    local NODE_NAME=$2

    echo "Cleaning $NODE_NAME..."

    if ssh -o ConnectTimeout=10 $SSH_USER@$IP bash << 'ENDSSH' 2>/dev/null
        set -e
        if [ -f /usr/local/bin/k3s-uninstall.sh ]; then
            echo "Uninstalling k3s server..."
            /usr/local/bin/k3s-uninstall.sh
        fi

        if [ -f /usr/local/bin/k3s-agent-uninstall.sh ]; then
            echo "Uninstalling k3s agent..."
            /usr/local/bin/k3s-agent-uninstall.sh
        fi

        echo "Cleaning directories..."
        rm -rf ~/.kube
ENDSSH
    then
        echo -e "${NODE_NAME} cleaned successfully"
        return 0
    else
        echo -e "${NODE_NAME} cleanup failed or already clean"
        return 1
    fi
}

destroy_node "$NODE1_IP" "node01"
sleep 1
destroy_node "$NODE2_IP" "node02"
sleep 1
destroy_node "$MASTER_IP" "master"

