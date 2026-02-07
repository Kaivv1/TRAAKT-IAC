import * as k8s from "@pulumi/kubernetes";
import { certManager } from "./cert-manager";

export const waitForCertManager = new k8s.batch.v1.Job(
    "wait-cert-manager",
    {
        metadata: { name: "wait-cert-manager", namespace: "cert-manager" },
        spec: {
            backoffLimit: 10,
            template: {
                spec: {
                    containers: [
                        {
                            name: "wait",
                            image: "quay.io/jetstack/cert-manager-cmctl:v1.16.2",
                            command: ["cmctl", "check", "api", "--wait=6m"],
                        },
                    ],
                    restartPolicy: "Never",
                },
            },
        },
    },
    { dependsOn: certManager },
);
