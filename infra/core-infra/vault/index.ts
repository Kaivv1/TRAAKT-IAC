import * as pulumi from "@pulumi/pulumi";
import * as command from "@pulumi/command";
import { createVaultNs } from "./namespace";
import { createVaultIngress } from "./ingress";
import { createVaultChart } from "./vault";
import { createUnsealVaultsCommand } from "./commands/unseal-command";
import { createPersistentFilePod } from "./file-pod";
import { createConfigureVaultCommand } from "./commands/configure-command";

export const deployVault = (dependsOn: pulumi.Resource[]) => {
    const vaultNs = createVaultNs(dependsOn);
    const vaultChart = createVaultChart(vaultNs.metadata.name, [vaultNs]);
    const vaultIngress = createVaultIngress(vaultNs.metadata.name, [vaultChart]);
    const vaultPodCheck = new command.local.Command(
        "check-vault-pod",
        {
            create: `
                kubectl rollout status statefulset/vault -n vault --timeout=5m
                kubectl wait --for=condition=Initialized pod/vault-0 -n vault --timeout=5m
            `,
        },
        { dependsOn: [vaultChart] },
    );
    const { initStoragePod } = createPersistentFilePod(vaultNs.metadata.name, [vaultPodCheck]);
    const unsealVaultsCommand = createUnsealVaultsCommand([initStoragePod]);
    const configureVaultCommand = createConfigureVaultCommand([unsealVaultsCommand]);

    return { vaultNs, vaultChart, vaultIngress, unsealVaultsCommand, configureVaultCommand };
};
