import * as k8s from "@pulumi/kubernetes";
import * as config from "../../shared/config";
import { backendNsDemo } from "./namespace";

export const backendServiceDemo = new k8s.core.v1.Service(
    "backend-svc-demo",
    {
        metadata: {
            name: "backend-svc-demo",
            namespace: backendNsDemo.metadata.name,
            labels: config.labels.backend.demo,
        },
        spec: {
            type: "ClusterIP",
            selector: config.labels.backend.demo,
            ports: [{ port: 80, targetPort: 8080 }],
        },
    },
    { dependsOn: [backendNsDemo] },
);
