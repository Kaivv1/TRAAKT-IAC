import * as command from "@pulumi/command";
import * as pulumi from "@pulumi/pulumi";

export const createUnsealVaultsCommand = (dependsOn: pulumi.Resource[]) => {
    return new command.local.Command(
        "unseal-vaults",
        {
            create: `
                kubectl wait --for=condition=Ready -n vault pod/init-pod --timeout=3m

                sleep 15
                kubectl cp vault/init-pod:/vault-init/vault-init.json ./vault-init.json
                sleep 2

                KEY1=$(cat vault-init.json | jq -r '.unseal_keys_b64[0]')
                KEY2=$(cat vault-init.json | jq -r '.unseal_keys_b64[1]')
                KEY3=$(cat vault-init.json | jq -r '.unseal_keys_b64[2]')

                kubectl exec -n vault vault-0 -- sh -c 'VAULT_CACERT=/vault/userconfig/vault-tls/ca.crt vault operator unseal "$1"' -- "$KEY1"
                kubectl exec -n vault vault-0 -- sh -c 'VAULT_CACERT=/vault/userconfig/vault-tls/ca.crt vault operator unseal "$1"' -- "$KEY2"
                kubectl exec -n vault vault-0 -- sh -c 'VAULT_CACERT=/vault/userconfig/vault-tls/ca.crt vault operator unseal "$1"' -- "$KEY3"

                kubectl wait --for=condition=Initialized -n vault pod/vault-1 --timeout=3m
                until kubectl exec -n vault vault-1 -- sh -c 'VAULT_CACERT=/vault/userconfig/vault-tls/ca.crt vault status' 2>/dev/null; do
                    echo "vault-1 not ready yet..."
                    sleep 3
                done
                kubectl exec -n vault vault-1 -- sh -c 'VAULT_CACERT=/vault/userconfig/vault-tls/ca.crt vault operator unseal "$1"' -- "$KEY1"
                kubectl exec -n vault vault-1 -- sh -c 'VAULT_CACERT=/vault/userconfig/vault-tls/ca.crt vault operator unseal "$1"' -- "$KEY2"
                kubectl exec -n vault vault-1 -- sh -c 'VAULT_CACERT=/vault/userconfig/vault-tls/ca.crt vault operator unseal "$1"' -- "$KEY3"

                kubectl wait --for=condition=Initialized -n vault pod/vault-2 --timeout=3m
                until kubectl exec -n vault vault-2 -- sh -c 'VAULT_CACERT=/vault/userconfig/vault-tls/ca.crt vault status' 2>/dev/null; do
                    echo "vault-2 not ready yet..."
                    sleep 3
                done
                kubectl exec -n vault vault-2 -- sh -c 'VAULT_CACERT=/vault/userconfig/vault-tls/ca.crt vault operator unseal "$1"' -- "$KEY1"
                kubectl exec -n vault vault-2 -- sh -c 'VAULT_CACERT=/vault/userconfig/vault-tls/ca.crt vault operator unseal "$1"' -- "$KEY2"
                kubectl exec -n vault vault-2 -- sh -c 'VAULT_CACERT=/vault/userconfig/vault-tls/ca.crt vault operator unseal "$1"' -- "$KEY3"
            `,
        },
        { dependsOn },
    );
};
