import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

export const createPostgresNs = (dependsOn: pulumi.Resource[]) => {
    return new k8s.core.v1.Namespace(
        "postgres",
        {
            metadata: { name: "postgres", labels: { app: "postgres" } },
        },
        { dependsOn },
    );
};
