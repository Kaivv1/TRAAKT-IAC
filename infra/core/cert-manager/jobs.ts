import * as k8s from "@pulumi/kubernetes";
import { certManager } from "./cert-manager";
import { certificate } from "./certificate";

export const waitForCertManager = new k8s.batch.v1.Job(
    "wait-cert-manager",
    {
        metadata: { name: "wait-cert-manager", namespace: "cert-manager" },
        spec: {
            template: {
                spec: {
                    containers: [
                        {
                            name: "wait",
                            image: "busybox:latest",
                            command: ["sh", "-c", "sleep 60"],
                        },
                    ],
                    restartPolicy: "Never",
                },
            },
        },
    },
    { dependsOn: certManager },
);

export const waitForCertificate = new k8s.batch.v1.Job(
    "wait-for-certificate",
    {
        metadata: { name: "wait-for-certificate", namespace: "cert-manager" },
        spec: {
            backoffLimit: 30,
            template: {
                spec: {
                    serviceAccountName: "cert-waiter",
                    containers: [
                        {
                            name: "wait",
                            image: "bitnami/kubectl:latest",
                            command: [
                                "sh",
                                "-c",
                                `
                            for i in $(seq 1 120); do
                                if kubectl get secret tls-cert-secret -n cert-manager &>/dev/null; then
                                    echo "Secret exists!"
                                    exit 0
                                fi
                                echo "Waiting... ($i/120)"
                                sleep 5
                            done
                            exit 1
                        `,
                            ],
                        },
                    ],
                    restartPolicy: "Never",
                },
            },
        },
    },
    { dependsOn: certificate },
);
