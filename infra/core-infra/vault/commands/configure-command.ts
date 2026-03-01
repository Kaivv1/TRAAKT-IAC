import * as command from "@pulumi/command";
import * as pulumi from "@pulumi/pulumi";

export const createConfigureVaultCommand = (dependsOn: pulumi.Resource[]) => {
    return new command.local.Command(
        "configure-vault",
        {
            create: `
                ROOT_TOKEN=$(cat vault-init.json | jq -r '.root_token')
                K8S_HOST=$(kubectl exec vault-0 -n vault -- sh -c 'echo $KUBERNETES_PORT_443_TCP_ADDR')
                echo 'path "secret/data/backend/*" { capabilities = ["read"] }' > /tmp/vault-policy.hcl
                kubectl cp /tmp/vault-policy.hcl vault/vault-0:/tmp/vault-policy.hcl

                kubectl exec vault-0 -n vault -- sh -c "
                    export VAULT_TOKEN='$ROOT_TOKEN'
                    export VAULT_CACERT=/vault/userconfig/vault-tls/ca.crt
                    vault auth enable kubernetes || true
                    vault secrets enable -path=secret kv-v2 || true

                    vault write auth/kubernetes/config \
                        kubernetes_host='https://$K8S_HOST:443' \
                        token_reviewer_jwt=@/var/run/secrets/kubernetes.io/serviceaccount/token \
                        kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt
                    
                    vault policy write backend-policy /tmp/vault-policy.hcl
                    
                    vault kv put secret/backend/config placeholder=true

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
