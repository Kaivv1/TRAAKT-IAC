import * as k8s from "@pulumi/kubernetes";

export const createBackendNs = (env: string) => {
    return new k8s.core.v1.Namespace(`backend-service-${env}`, {
        metadata: { name: `backend-service-${env}`, labels: { app: "backend", environment: env } },
    });
};
