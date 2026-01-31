import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as config from "../../shared/config";
import { backendNsDemo } from "./namespace";
import { letsEncrypt, letsEncryptTest, certificate, copyTlsSecretToNamespace } from "../../core/cert-manager";
import { TraefikMiddleware } from "../../components/traefik.middleware";
import { backendServiceDemo } from "./service";

const crd = "@kubernetescrd";
const namespace = backendNsDemo.metadata.name;

export const backendHttpsRedirectMiddlewareDemo = TraefikMiddleware.createHttpsRedirect(
    "backend-https-redirect-demo",
    namespace,
    config.labels.backend.demo,
);

export const backendCorsMiddlewareDemo = TraefikMiddleware.createCors(
    "backend-cors-demo",
    namespace,
    config.labels.backend.demo,
    ["https://demo.traakt.com"],
);

export const backendRateLimitMiddlewareDemo = TraefikMiddleware.createRateLimit(
    "backend-rate-limit-demo",
    namespace,
    config.labels.backend.demo,
);

const middlewaresLiteral = pulumi.interpolate`${namespace}-${backendHttpsRedirectMiddlewareDemo.name}${crd},${namespace}-${backendCorsMiddlewareDemo.name}${crd},${namespace}-${backendRateLimitMiddlewareDemo.name}${crd}`;

const backendTlsSecretDemo = copyTlsSecretToNamespace("backend-tls-secret-demo", namespace, [
    backendNsDemo,
]) as pulumi.Input<pulumi.Resource>;

export const backendIngressDemo = new k8s.networking.v1.Ingress(
    "backend-ingress-demo",
    {
        metadata: {
            name: "backend-ingress-demo",
            namespace,
            labels: config.labels.backend.demo,
            annotations: {
                "kubernetes.io/ingress.class": "traefik",
                // "cert-manager.io/cluster-issuer": config.issuer,
                "traefik.ingress.kubernetes.io/router.middlewares": middlewaresLiteral,
            },
        },
        spec: {
            tls: [
                {
                    hosts: ["demo.traakt.com"],
                    secretName: "tls-cert",
                },
            ],
            rules: [
                {
                    host: "demo.traakt.com",
                    http: {
                        paths: [
                            {
                                path: "/api",
                                pathType: "Prefix",
                                backend: {
                                    service: {
                                        name: backendServiceDemo.metadata.name,
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
            backendNsDemo,
            letsEncryptTest,
            letsEncrypt,
            backendTlsSecretDemo,
            backendHttpsRedirectMiddlewareDemo,
            backendCorsMiddlewareDemo,
            backendRateLimitMiddlewareDemo,
        ],
    },
);
