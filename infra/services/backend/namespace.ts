import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

export const createBackendNs = (env: string, dependsOn: pulumi.Resource[]) => {
    return new k8s.core.v1.Namespace(
        `backend-service-${env}`,
        {
            metadata: { name: `backend-service-${env}`, labels: { app: "backend", environment: env } },
        },
        { dependsOn },
    );
};
