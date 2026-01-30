import * as k8s from "@pulumi/kubernetes";
import * as config from "../../shared/config";
import { backendNsDev } from "./namespace";

export const backendServiceDev = new k8s.core.v1.Service(
    "backend-svc-dev",
    {
        metadata: {
            name: "backend-svc-dev",
            namespace: backendNsDev.metadata.name,
            labels: config.labels.backend.dev,
        },
        spec: {
            type: "ClusterIP",
            selector: config.labels.backend.dev,
            ports: [{ port: 80, targetPort: 8080 }],
        },
    },
    { dependsOn: [backendNsDev] },
);
