import * as pulumi from "@pulumi/pulumi";
import { createVaultNs } from "./namespace";
import { createVaultIngress } from "./ingress";
import { createVaultChart } from "./vault";
import { createUnsealVaultsCommand } from "./unseal-command";

export const deployVault = (dependsOn: pulumi.Resource[]) => {
    const vaultNs = createVaultNs(dependsOn);
    const vaultChart = createVaultChart(vaultNs.metadata.name, [vaultNs]);
    const vaultIngress = createVaultIngress(vaultNs.metadata.name, [vaultChart]);
    const unsealVaultsCommand = createUnsealVaultsCommand([vaultIngress]);

    return { vaultNs, vaultChart, vaultIngress, unsealVaultsCommand };
};
