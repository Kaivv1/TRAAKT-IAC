import * as k8s from "@pulumi/kubernetes";

export const certManagerNs = new k8s.core.v1.Namespace("cert-manager", {
    metadata: { name: "cert-manager" },
});

export const certManager = new k8s.helm.v3.Chart(
    "cert-manager",
    {
        chart: "cert-manager",
        namespace: "cert-manager",
        fetchOpts: { repo: "https://charts.jetstack.io" },
        values: { installCRDs: true },
    },
    {
        dependsOn: certManagerNs,
    },
);
