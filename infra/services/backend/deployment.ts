import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

export const createBackendDeployment = (
    namespace: pulumi.Output<string>,
    env: string,
    dependsOn: pulumi.Resource[],
) => {
    return new k8s.apps.v1.Deployment(
        `backend-${env}`,
        {
            metadata: {
                name: `backend-${env}`,
                namespace,
                labels: { app: "backend", environment: env },
            },
            spec: {
                selector: { matchLabels: { app: "backend", environment: env } },
                replicas: 2,
                template: {
                    metadata: { labels: { app: "backend", environment: env } },
                    spec: {
                        containers: [
                            {
                                name: `api-container-${env}`,
                                image: "kaivv1/json-hello",
                                ports: [{ containerPort: 8080 }],
                            },
                        ],
                    },
                },
            },
        },
        { dependsOn },
    );
};
