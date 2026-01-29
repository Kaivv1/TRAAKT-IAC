import * as k8s from "@pulumi/kubernetes";
import * as config from "../../shared/config";
import { backendNs } from "./namespace";

export const backendService = new k8s.core.v1.Service(
    "backend-svc",
    {
        metadata: {
            namespace: backendNs.metadata.name,
            labels: config.labels.backend,
        },
        spec: {
            type: "ClusterIP",
            selector: config.labels.backend,
            ports: [{ port: 80, targetPort: 80 }],
        },
    },
    { dependsOn: [backendNs] },
);
