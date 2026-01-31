import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as config from "../../shared/config";
import { backendNsDev } from "./namespace";
import { letsEncrypt, letsEncryptTest, certificate, copyTlsSecretToNamespace } from "../../core/cert-manager";
import { TraefikMiddleware } from "../../components/traefik.middleware";
import { backendServiceDev } from "./service";

const crd = "@kubernetescrd";
const namespace = backendNsDev.metadata.name;

export const backendHttpsRedirectMiddlewareDev = TraefikMiddleware.createHttpsRedirect(
    "backend-https-redirect-dev",
    namespace,
    config.labels.backend.dev,
);

export const backendCorsMiddlewareDev = TraefikMiddleware.createCors(
    "backend-cors-dev",
    namespace,
    config.labels.backend.dev,
    ["https://dev.traakt.com"],
);

export const backendRateLimitMiddlewareDev = TraefikMiddleware.createRateLimit(
    "backend-rate-limit-dev",
    namespace,
    config.labels.backend.dev,
);

const middlewaresLiteral = pulumi.interpolate`${namespace}-${backendHttpsRedirectMiddlewareDev.name}${crd},${namespace}-${backendCorsMiddlewareDev.name}${crd},${namespace}-${backendRateLimitMiddlewareDev.name}${crd}`;

const backendTlsSecretDev = copyTlsSecretToNamespace("backend-tls-secret-dev", namespace, [
    backendNsDev,
]) as pulumi.Input<pulumi.Resource>;

export const backendIngressDev = new k8s.networking.v1.Ingress(
    "backend-ingress-dev",
    {
        metadata: {
            name: "backend-ingress-dev",
            namespace,
            labels: config.labels.backend.dev,
            annotations: {
                "kubernetes.io/ingress.class": "traefik",
                // "cert-manager.io/cluster-issuer": config.issuer,
                "traefik.ingress.kubernetes.io/router.middlewares": middlewaresLiteral,
            },
        },
        spec: {
            tls: [
                {
                    hosts: ["dev.traakt.com"],
                    secretName: "tls-cert",
                },
            ],
            rules: [
                {
                    host: "dev.traakt.com",
                    http: {
                        paths: [
                            {
                                path: "/api",
                                pathType: "Prefix",
                                backend: {
                                    service: {
                                        name: backendServiceDev.metadata.name,
                                        port: { number: 80 },
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
        dependsOn: [
            backendNsDev,
            letsEncryptTest,
            letsEncrypt,
            backendTlsSecretDev,
            backendHttpsRedirectMiddlewareDev,
            backendCorsMiddlewareDev,
            backendRateLimitMiddlewareDev,
        ],
    },
);
