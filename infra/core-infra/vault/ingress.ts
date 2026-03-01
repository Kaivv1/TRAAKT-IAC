import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { TraefikMiddleware } from "../../components/traefik.middleware";

export const createVaultIngress = (namespace: pulumi.Output<string>, dependsOn: pulumi.Resource[]) => {
    const crd = "@kubernetescrd";
    const labels = { app: "vault" };
    const vaultHttpsRedirectMiddleware = TraefikMiddleware.createHttpsRedirect(
        `vault-https-redirect`,
        namespace,
        labels,
        { dependsOn },
    );

    const middlewaresLiteral = pulumi.interpolate`${namespace}-${vaultHttpsRedirectMiddleware.name}${crd}`;

    // return new k8s.networking.v1.Ingress(
    //     `vault-ingress`,
    //     {
    //         metadata: {
    //             name: `vault-ingress`,
    //             namespace,
    //             labels,
    //             annotations: {
    //                 "kubernetes.io/ingress.class": "traefik",
    //                 "traefik.ingress.kubernetes.io/router.middlewares": middlewaresLiteral,
    //                 "traefik.ingress.kubernetes.io/service.serverstransport": "vault-transport@vault",
    //             },
    //         },
    //         spec: {
    //             tls: [
    //                 {
    //                     hosts: [`vault.traakt.com`],
    //                     secretName: "tls-cert-secret",
    //                 },
    //             ],
    //             rules: [
    //                 {
    //                     host: `vault.traakt.com`,
    //                     http: {
    //                         paths: [
    //                             {
    //                                 path: "/",
    //                                 pathType: "Prefix",
    //                                 backend: {
    //                                     service: {
    //                                         name: "vault",
    //                                         port: { number: 8200 },
    //                                     },
    //                                 },
    //                             },
    //                         ],
    //                     },
    //                 },
    //             ],
    //         },
    //     },
    //     {
    //         dependsOn: [vaultHttpsRedirectMiddleware, ...dependsOn],
    //     },
    // );
    const httpRoute = new k8s.apiextensions.CustomResource(
        "vault-ingress-http",
        {
            apiVersion: "traefik.io/v1alpha1",
            kind: "IngressRoute",
            metadata: { name: "vault-ingress-http", namespace, labels },
            spec: {
                entryPoints: ["web"],
                routes: [
                    {
                        match: "Host(`vault.traakt.com`)",
                        kind: "Rule",
                        middlewares: [{ name: vaultHttpsRedirectMiddleware.name, namespace }],
                        services: [{ name: "vault", port: 8200 }],
                    },
                ],
            },
        },
        { dependsOn: [vaultHttpsRedirectMiddleware, ...dependsOn] },
    );

    const httpsRoute = new k8s.apiextensions.CustomResource(
        "vault-ingress-https",
        {
            apiVersion: "traefik.io/v1alpha1",
            kind: "IngressRoute",
            metadata: { name: "vault-ingress-https", namespace, labels },
            spec: {
                entryPoints: ["websecure"],
                routes: [
                    {
                        match: "Host(`vault.traakt.com`)",
                        kind: "Rule",
                        services: [
                            {
                                name: "vault",
                                port: 8200,
                                serversTransport: "vault-transport",
                            },
                        ],
                    },
                ],
                tls: {
                    secretName: "tls-cert-secret",
                },
            },
        },
        { dependsOn: [vaultHttpsRedirectMiddleware, ...dependsOn] },
    );

    return httpsRoute;
};
