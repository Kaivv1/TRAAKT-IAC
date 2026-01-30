import * as k8s from "@pulumi/kubernetes";
import * as config from "../../shared/config";
import { backendNsDev } from "./namespace";

export const backendDeploymentDev = new k8s.apps.v1.Deployment(
    "backend-dev",
    {
        metadata: { name: "backend-dev", namespace: backendNsDev.metadata.name, labels: config.labels.backend.dev },
        spec: {
            selector: { matchLabels: config.labels.backend.dev },
            replicas: 2,
            template: {
                metadata: { labels: config.labels.backend.dev },
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
    { dependsOn: [backendNsDev] },
);
