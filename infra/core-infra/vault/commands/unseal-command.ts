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

            kubectl exec -n vault vault-0 -- sh -c "
                export VAULT_CACERT=/vault/userconfig/vault-tls/ca.crt
                vault operator unseal '$KEY1'
                vault operator unseal '$KEY2'
                vault operator unseal '$KEY3'
            "

            sleep 15

            kubectl exec -n vault vault-1 -- sh -c "
                export VAULT_CACERT=/vault/userconfig/vault-tls/ca.crt
                vault operator unseal '$KEY1'
                vault operator unseal '$KEY2'
                vault operator unseal '$KEY3'
            "

            sleep 15

            kubectl exec -n vault vault-2 -- sh -c "
                export VAULT_CACERT=/vault/userconfig/vault-tls/ca.crt
                vault operator unseal '$KEY1'
                vault operator unseal '$KEY2'
                vault operator unseal '$KEY3'
            "

            sleep 15
        `,
        },
        { dependsOn },
    );
};
