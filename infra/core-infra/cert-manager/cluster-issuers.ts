import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

export const createLetsEncryptTest = (dependsOn: pulumi.Resource[]) => {
    return new k8s.apiextensions.CustomResource(
        "letsencrypt-test-issuer",
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
        { dependsOn },
    );
};

export const createLetsEncrypt = (dependsOn: pulumi.Resource[]) => {
    return new k8s.apiextensions.CustomResource(
        "letsencrypt-issuer",
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
        { dependsOn },
    );
};

export const createSelfSignIssuer = (dependsOn: pulumi.Resource[]) => {
    return new k8s.apiextensions.CustomResource(
        "selfsign-issuer",
        {
            apiVersion: "cert-manager.io/v1",
            kind: "ClusterIssuer",
            metadata: {
                name: "selfsign-issuer",
            },
            spec: {
                selfSigned: {},
            },
        },
        { dependsOn },
    );
};

export const createInternalIssuer = (dependsOn: pulumi.Resource[]) => {
    return new k8s.apiextensions.CustomResource(
        "internal-issuer",
        {
            apiVersion: "cert-manager.io/v1",
            kind: "ClusterIssuer",
            metadata: {
                name: "internal-issuer",
            },
            spec: {
                ca: {
                    secretName: "internal-ca-secret",
                },
            },
        },
        { dependsOn },
    );
};
