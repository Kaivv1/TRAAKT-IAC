import * as k8s from "@pulumi/kubernetes";
import * as config from "../../shared/config";
import { backendNs } from "./namespace";

export const backendDeployment = new k8s.apps.v1.Deployment(
    `backend-${config.vars.environment}`,
    {
        metadata: {
            name: `backend-${config.vars.environment}`,
            namespace: backendNs.metadata.name,
            labels: config.labels.backend,
        },
        spec: {
            selector: { matchLabels: config.labels.backend },
            replicas: 2,
            template: {
                metadata: { labels: config.labels.backend },
                spec: {
                    containers: [
                        {
                            name: `api-container-${config.vars.environment}`,
                            image: "kaivv1/json-hello",
                            ports: [{ containerPort: 8080 }],
                        },
                    ],
                },
            },
        },
    },
    { dependsOn: [backendNs], protect: true },
);
