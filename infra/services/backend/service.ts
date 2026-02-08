import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

export const createBackendSvc = (namespace: pulumi.Output<string>, env: string, dependsOn: pulumi.Resource[]) => {
    return new k8s.core.v1.Service(
        `backend-svc-${env}`,
        {
            metadata: {
                name: `backend-svc-${env}`,
                namespace,
                labels: { app: "backend", environment: env },
            },
            spec: {
                type: "ClusterIP",
                selector: { app: "backend", environment: env },
                ports: [{ port: 80, targetPort: 8080 }],
            },
        },
        { dependsOn },
    );
};
