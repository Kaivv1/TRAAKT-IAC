import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

export const createBackendDeployment = (
    namespace: pulumi.Output<string>,
    env: string,
    dependsOn: pulumi.Resource[],
) => {
    const backendSA = new k8s.core.v1.ServiceAccount(
        `backend-sa-${env}`,
        {
            metadata: {
                name: "backend",
                namespace,
            },
        },
        { dependsOn },
    );

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
                    metadata: {
                        labels: { app: "backend", environment: env },
                        annotations: {
                            "vault.hashicorp.com/agent-inject": "true",
                            "vault.hashicorp.com/role": `backend-${env}`,
                            "vault.hashicorp.com/agent-cache-enable": "true",
                            "vault.hashicorp.com/template-static-secret-render-interval": "1m",
                            "vault.hashicorp.com/agent-inject-secret-backend.json": "secret/data/backend/config",
                            "vault.hashicorp.com/agent-inject-template-backend.json": `
                                {{- with secret "secret/data/backend/config" -}}
                                {{ .Data.data | toJSONPretty }}
                                {{- end -}}
                            `,
                        },
                    },
                    spec: {
                        serviceAccountName: backendSA.metadata.name,
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
        { dependsOn: [backendSA] },
    );
};
