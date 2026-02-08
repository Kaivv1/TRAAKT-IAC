import * as k8s from "@pulumi/kubernetes";

export const certManagerNs = new k8s.core.v1.Namespace("cert-manager", {
    metadata: { name: "cert-manager" },
});

export const certManager = new k8s.helm.v3.Release(
    "cert-manager",
    {
        chart: "cert-manager",
        namespace: "cert-manager",
        repositoryOpts: { repo: "https://charts.jetstack.io" },
        waitForJobs: true,
        timeout: 400,
        values: {
            crds: {
                enabled: true,
                keep: true,
            },
            replicaCount: 2,
            networkPolicy: {
                enabled: true,
            },
            webhook: {
                repicaCount: 2,
                readinessProbe: {
                    initialDelaySeconds: 10,
                    periodSeconds: 5,
                    failureThreshold: 8,
                    timeoutSeconds: 10,
                },
                livenessProbe: {
                    initialDelaySeconds: 30,
                    periodSeconds: 10,
                    failureThreshold: 12,
                    timeoutSeconds: 15,
                },
            },
            cainjector: {
                replicaCount: 2,
            },
        },
    },
    {
        dependsOn: certManagerNs,
    },
);
