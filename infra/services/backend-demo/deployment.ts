import * as k8s from "@pulumi/kubernetes";
import * as config from "../../shared/config";
import { backendNsDemo } from "./namespace";

export const backendDeploymentDemo = new k8s.apps.v1.Deployment(
    "backend-demo",
    {
        metadata: { name: "backend-demo", namespace: backendNsDemo.metadata.name, labels: config.labels.backend.demo },
        spec: {
            selector: { matchLabels: config.labels.backend.demo },
            replicas: 2,
            template: {
                metadata: { labels: config.labels.backend.demo },
                spec: {
                    containers: [
                        {
                            name: "api-container-demo",
                            image: "kaivv1/json-hello",
                            ports: [{ containerPort: 8080 }],
                        },
                    ],
                },
            },
        },
    },
    { dependsOn: [backendNsDemo] },
);
