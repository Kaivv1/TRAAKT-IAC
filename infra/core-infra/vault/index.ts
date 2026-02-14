import * as pulumi from "@pulumi/pulumi";
import { createVaultNs } from "./namespace";
import { createVaultIngress } from "./ingress";
import { createVaultChart } from "./vault";

export const deployVault = (dependsOn: pulumi.Resource[]) => {
    const vaultNs = createVaultNs();
    const vaultChart = createVaultChart(vaultNs.metadata.name, [vaultNs, ...dependsOn]);
    const vaultIngress = createVaultIngress(vaultNs.metadata.name, [vaultChart, ...dependsOn]);
    return { vaultNs, vaultChart, vaultIngress };
};
