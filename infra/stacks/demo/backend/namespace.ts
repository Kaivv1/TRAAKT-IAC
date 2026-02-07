import * as k8s from "@pulumi/kubernetes";

export const labels = { app: "backend", environment: "demo" };

export const backendNs = new k8s.core.v1.Namespace("backend-service-demo", {
    metadata: { name: "backend-service-demo", labels },
});
