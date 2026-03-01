import * as pulumi from "@pulumi/pulumi";
import * as command from "@pulumi/command";
import { createVaultNs } from "./namespace";
import { createVaultIngress } from "./ingress";
import { createVaultChart } from "./vault";
import { createUnsealVaultsCommand } from "./commands/unseal-command";
import { createPersistentFilePod } from "./file-pod";
import { createConfigureVaultCommand } from "./commands/configure-command";
import { createTrustInternalCert } from "./servers-transport";

export const deployVault = (dependsOn: pulumi.Resource[]) => {
    const vaultNs = createVaultNs(dependsOn);
    const vaultChart = createVaultChart(vaultNs.metadata.name, [vaultNs]);
    const trustInternalCaCert = createTrustInternalCert(vaultNs.metadata.name, [vaultChart]);
    const vaultIngress = createVaultIngress(vaultNs.metadata.name, [trustInternalCaCert]);
    const vaultPodCheck = new command.local.Command(
        "check-vault-pod",
        {
            create: `
                echo "Waiting for vault-0 pod to exist..."
                until kubectl get pod vault-0 -n vault 2>/dev/null; do
                    echo "vault-0 not found yet, waiting..."
                    sleep 5
                done
                echo "vault-0 found, waiting for Initialized..."
                kubectl wait --for=condition=Initialized pod/vault-0 -n vault --timeout=5m
            `,
        },
        { dependsOn: [vaultIngress] },
    );
    const { initStoragePod } = createPersistentFilePod(vaultNs.metadata.name, [vaultPodCheck]);
    const unsealVaultsCommand = createUnsealVaultsCommand([initStoragePod]);
    const configureVaultCommand = createConfigureVaultCommand([unsealVaultsCommand]);

    return { vaultNs, vaultChart, vaultIngress, unsealVaultsCommand, configureVaultCommand };
};
