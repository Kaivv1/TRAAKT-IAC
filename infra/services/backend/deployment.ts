import * as k8s from "@pulumi/kubernetes";
import * as config from "../../shared/config";
import { backendNs } from "./namespace";

export const backendDeployment = new k8s.apps.v1.Deployment(
    "backend",
    {
        metadata: { name: "backend", namespace: backendNs.metadata.name, labels: config.labels.backend },
        spec: {
            selector: { matchLabels: config.labels.backend },
            replicas: 2,
            template: {
                metadata: { labels: config.labels.backend },
                spec: {
                    containers: [
                        {
                            name: "api",
                            image: "nginxdemos/hello",
                            ports: [{ containerPort: 80 }],
                        },
                    ],
                },
            },
        },
    },
    { dependsOn: [backendNs] },
);
