import * as command from "@pulumi/command";
import * as pulumi from "@pulumi/pulumi";

export const createUnsealVaultsCommand = (dependsOn: pulumi.Resource[]) => {
    return new command.local.Command(
        "unseal-vaults",
        {
            create: `
            #!/bin/bash
            
            kubectl wait --for=jsonpath='{.status.phase}'=Running pod/vault-0 -n vault --timeout=3m

            kubectl exec -n vault vault-0 -- vault operator init -key-shares=5 -key-threshold=3 -format=json > vault-init.json

            KEY1=$(cat vault-init.json | jq -r '.unseal_keys_b64[0]')
            KEY2=$(cat vault-init.json | jq -r '.unseal_keys_b64[1]')
            KEY3=$(cat vault-init.json | jq -r '.unseal_keys_b64[2]')

            kubectl exec -n vault vault-0 -- vault operator unseal $KEY1 >/dev/null
            kubectl exec -n vault vault-0 -- vault operator unseal $KEY2 >/dev/null
            kubectl exec -n vault vault-0 -- vault operator unseal $KEY3 >/dev/null

            sleep 15

            kubectl exec -n vault vault-1 -- vault operator unseal $KEY1 >/dev/null
            kubectl exec -n vault vault-1 -- vault operator unseal $KEY2 >/dev/null
            kubectl exec -n vault vault-1 -- vault operator unseal $KEY3 >/dev/null

            sleep 15

            kubectl exec -n vault vault-2 -- vault operator unseal $KEY1 >/dev/null
            kubectl exec -n vault vault-2 -- vault operator unseal $KEY2 >/dev/null
            kubectl exec -n vault vault-2 -- vault operator unseal $KEY3 >/dev/null

            sleep 15
        `,
        },
        { dependsOn },
    );
};
