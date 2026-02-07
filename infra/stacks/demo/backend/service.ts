import * as k8s from "@pulumi/kubernetes";
import { backendNs, labels } from "./namespace";

export const backendService = new k8s.core.v1.Service(
    "backend-svc-demo",
    {
        metadata: {
            name: "backend-svc-demo",
            namespace: backendNs.metadata.name,
            labels,
        },
        spec: {
            type: "ClusterIP",
            selector: labels,
            ports: [{ port: 80, targetPort: 8080 }],
        },
    },
    { dependsOn: [backendNs] },
);
