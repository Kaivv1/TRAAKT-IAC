import * as pulumi from "@pulumi/pulumi";
import { createVaultNs } from "./namespace";
import { createVaultIngress } from "./ingress";
import { createVaultChart } from "./vault";
import { createUnsealVaultsCommand } from "./unseal-command";
import { createPersistentFilePod } from "./file-pod";

export const deployVault = (dependsOn: pulumi.Resource[]) => {
    const vaultNs = createVaultNs(dependsOn);
    const vaultChart = createVaultChart(vaultNs.metadata.name, [vaultNs]);
    const vaultIngress = createVaultIngress(vaultNs.metadata.name, [vaultChart]);
    const { initStoragePod } = createPersistentFilePod(vaultNs.metadata.name, [vaultIngress]);
    const unsealVaultsCommand = createUnsealVaultsCommand([initStoragePod]);

    return { vaultNs, vaultChart, vaultIngress, unsealVaultsCommand };
};
