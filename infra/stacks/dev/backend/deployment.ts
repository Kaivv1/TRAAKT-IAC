import * as k8s from "@pulumi/kubernetes";
import { backendNs, labels } from "./namespace";

export const backendDeployment = new k8s.apps.v1.Deployment(
    "backend-dev",
    {
        metadata: {
            name: "backend-dev",
            namespace: backendNs.metadata.name,
            labels,
        },
        spec: {
            selector: { matchLabels: labels },
            replicas: 2,
            template: {
                metadata: { labels },
                spec: {
                    containers: [
                        {
                            name: "api-container-dev",
                            image: "kaivv1/json-hello",
                            ports: [{ containerPort: 8080 }],
                        },
                    ],
                },
            },
        },
    },
    { dependsOn: [backendNs] },
);
