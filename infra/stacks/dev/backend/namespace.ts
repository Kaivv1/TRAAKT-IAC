import * as k8s from "@pulumi/kubernetes";

export const labels = { app: "backend", environment: "dev" };

export const backendNs = new k8s.core.v1.Namespace("backend-service-dev", {
    metadata: { name: "backend-service-dev", labels },
});
