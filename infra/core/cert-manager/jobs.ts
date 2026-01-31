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

// export const waitForCertificate = new k8s.batch.v1.Job(
//     "wait-for-certificate",
//     {
//         metadata: {
//             name: "wait-for-certificate",
//             namespace: "cert-manager",
//         },
//         spec: {
//             backoffLimit: 30,
//             ttlSecondsAfterFinished: 60,
//             template: {
//                 spec: {
//                     serviceAccountName: "cert-waiter",
//                     containers: [
//                         {
//                             name: "wait",
//                             image: "bitnami/kubectl:latest",
//                             command: [
//                                 "sh",
//                                 "-c",
//                                 `
//                                 echo "Waiting for certificate to be ready..."
//                                 for i in $(seq 1 120); do
//                                     READY=$(kubectl get certificate tls-cert -n cert-manager -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>/dev/null || echo "")
//                                     if [ "$READY" = "True" ]; then
//                                         echo "Certificate is ready!"
//                                         if kubectl get secret tls-cert-secret -n cert-manager &>/dev/null; then
//                                             echo "Secret exists! Deployment can proceed."
//                                             exit 0
//                                         fi
//                                     fi
//                                     echo "Still waiting... ($i/120) - Status: $READY"
//                                     sleep 5
//                                 done
//                                 echo "Timeout waiting for certificate"
//                                 exit 1
//                                 `,
//                             ],
//                         },
//                     ],
//                     restartPolicy: "Never",
//                 },
//             },
//         },
//     },
//     { dependsOn: [certificate, certWaiterSA, certWaiterRoleBinding] },
// );
