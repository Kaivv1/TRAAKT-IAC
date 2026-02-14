import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

export const createVaultNs = (dependsOn: pulumi.Resource[]) => {
    return new k8s.core.v1.Namespace(
        "vault",
        {
            metadata: { name: "vault", labels: { app: "vault" } },
        },
        { dependsOn },
    );
};
