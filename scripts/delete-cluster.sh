#!/bin/bash

set -euo pipefail

MASTER_IP=$1
AGENT_IPS_STR=$2
SSH_USER=$3

IFS=',' read -ra AGENT_IPS <<< "$AGENT_IPS_STR"

destroy_node() {
    local IP=$1
    local NODE_NAME=$2

    echo "Cleaning $NODE_NAME..."

    if ssh -o ConnectTimeout=10 $SSH_USER@$IP bash << 'ENDSSH' >/dev/null 2>&1
        set -e
        if [ -f /usr/local/bin/k3s-uninstall.sh ]; then
            echo "Uninstalling k3s server..."
            /usr/local/bin/k3s-uninstall.sh

            echo "Removing pulumi state folder..."
            rm -rf /var/pulumi
        fi

        if [ -f /usr/local/bin/k3s-agent-uninstall.sh ]; then
            echo "Uninstalling k3s agent..."
            /usr/local/bin/k3s-agent-uninstall.sh
        fi

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

for i in "${!AGENT_IPS[@]}"; do
    NAME="node$(printf '%02d' $((i+1)))"
    NODE_IP="${AGENT_IPS[$i]}"

    destroy_node $NODE_IP $NAME
    sleep 1
done

destroy_node $MASTER_IP "master"

