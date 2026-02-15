import * as pulumi from "@pulumi/pulumi";
import * as command from "@pulumi/command";
import { createVaultNs } from "./namespace";
import { createVaultIngress } from "./ingress";
import { createVaultChart } from "./vault";
import { createUnsealVaultsCommand } from "./unseal-command";
import { createPersistentFilePod } from "./file-pod";

export const deployVault = (dependsOn: pulumi.Resource[]) => {
    const vaultNs = createVaultNs(dependsOn);
    const vaultChart = createVaultChart(vaultNs.metadata.name, [vaultNs]);
    const vaultIngress = createVaultIngress(vaultNs.metadata.name, [vaultChart]);
    const vaultPodCheck = new command.local.Command(
        "check-vault-pod",
        {
            create: `kubectl wait --for=jsonpath='{.status.phase}'=Running -n vault pod/vault-0 --timeout=3m`,
        },
        { dependsOn: [vaultIngress] },
    );
    const { initStoragePod } = createPersistentFilePod(vaultNs.metadata.name, [vaultPodCheck]);
    const unsealVaultsCommand = createUnsealVaultsCommand([initStoragePod]);

    return { vaultNs, vaultChart, vaultIngress, unsealVaultsCommand };
};
