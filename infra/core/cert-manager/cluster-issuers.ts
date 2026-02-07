import * as k8s from "@pulumi/kubernetes";
import { waitForCertManager } from "./jobs";

export const letsEncryptTest = new k8s.apiextensions.CustomResource(
    "letsencrypt-test",
    {
        apiVersion: "cert-manager.io/v1",
        kind: "ClusterIssuer",
        metadata: { name: "letsencrypt-test" },
        spec: {
            acme: {
                server: "https://acme-staging-v02.api.letsencrypt.org/directory",
                email: "gigoo2442@gmail.com",
                privateKeySecretRef: { name: "letsencrypt-testing-key" },
                solvers: [{ http01: { ingress: { class: "traefik" } } }],
            },
        },
    },
    { dependsOn: waitForCertManager },
);

export const letsEncrypt = new k8s.apiextensions.CustomResource(
    "letsencrypt",
    {
        apiVersion: "cert-manager.io/v1",
        kind: "ClusterIssuer",
        metadata: { name: "letsencrypt" },
        spec: {
            acme: {
                server: "https://acme-v02.api.letsencrypt.org/directory",
                email: "gigoo2442@gmail.com",
                privateKeySecretRef: { name: "letsencrypt-key" },
                solvers: [{ http01: { ingress: { class: "traefik" } } }],
            },
        },
    },
    { dependsOn: waitForCertManager },
);
