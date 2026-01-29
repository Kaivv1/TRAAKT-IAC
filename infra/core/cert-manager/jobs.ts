import * as k8s from "@pulumi/kubernetes";
import { certManager } from "./cert-manager";

export const waitForCertManager = new k8s.batch.v1.Job(
    "wait-cert-manager",
    {
        metadata: { namespace: "cert-manager" },
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
