import * as k8s from "@pulumi/kubernetes";

export const createVaultNs = () => {
    return new k8s.core.v1.Namespace("vault", {
        metadata: { name: "vault", labels: { app: "vault" } },
    });
};
