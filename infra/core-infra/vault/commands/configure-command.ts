import * as command from "@pulumi/command";
import * as pulumi from "@pulumi/pulumi";

export const createConfigureVaultCommand = (dependsOn: pulumi.Resource[]) => {
    return new command.local.Command(
        "configure-vault",
        {
            create: `
                ROOT_TOKEN=$(cat vault-init.json | jq -r '.root_token')
                echo 'path "secret/data/backend/*" { capabilities = ["read"] }' > /tmp/vault-policy.hcl
                kubectl cp /tmp/vault-policy.hcl vault/vault-0:/tmp/vault-policy.hcl

                kubectl exec vault-0 -n vault -- sh -c "
                export VAULT_TOKEN='$ROOT_TOKEN'
                
                vault secrets enable -path=secret kv-v2 || true
                vault auth enable kubernetes || true
                vault write auth/kubernetes/config kubernetes_host='https://\$KUBERNETES_PORT_443_TCP_ADDR:443'

                vault policy write backend-policy /tmp/vault-policy.hcl

                vault write auth/kubernetes/role/backend-dev \
                    bound_service_account_names=backend \
                    bound_service_account_namespaces=backend-service-dev \
                    policies=backend-policy \
                    ttl=24h

                vault write auth/kubernetes/role/backend-demo \
                    bound_service_account_names=backend \
                    bound_service_account_namespaces=backend-service-demo \
                    policies=backend-policy \
                    ttl=24h
                "
            `,
        },
        { dependsOn },
    );
};
