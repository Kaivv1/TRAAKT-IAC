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

    return new k8s.networking.v1.Ingress(
        `vault-ingress`,
        {
            metadata: {
                name: `vault-ingress`,
                namespace,
                labels,
                annotations: {
                    "kubernetes.io/ingress.class": "traefik",
                    "traefik.ingress.kubernetes.io/router.middlewares": middlewaresLiteral,
                    "traefik.ingress.kubernetes.io/service.serverstransport": "vault-transport@kube-system",
                },
            },
            spec: {
                tls: [
                    {
                        hosts: [`vault.traakt.com`],
                        secretName: "tls-cert-secret",
                    },
                ],
                rules: [
                    {
                        host: `vault.traakt.com`,
                        http: {
                            paths: [
                                {
                                    path: "/",
                                    pathType: "Prefix",
                                    backend: {
                                        service: {
                                            name: "vault",
                                            port: { number: 8200 },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                ],
            },
        },
        {
            dependsOn: [vaultHttpsRedirectMiddleware, ...dependsOn],
        },
    );
};
