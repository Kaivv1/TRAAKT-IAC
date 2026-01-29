import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as config from "../../shared/config";
import { backendNs } from "./namespace";
import { letsEncrypt, letsEncryptTest } from "../../core/cert-manager";
import { TraefikMiddleware } from "../../components/traefik.middleware";
import { backendService } from "./service";

const crd = "@kubernetescrd";
const namespace = pulumi.interpolate`${backendNs.metadata.name}`;

export const backendHttpsRedirectMiddleware = TraefikMiddleware.createHttpsRedirect(
    "https-redirect",
    namespace,
    config.labels.backend,
);

export const backendCorsMiddleware = TraefikMiddleware.createCors("cors", namespace, config.labels.backend);

export const backendRateLimitMiddleware = TraefikMiddleware.createRateLimit(
    "rate-limit",
    namespace,
    config.labels.backend,
);

const middlewaresLiteral = pulumi.interpolate`${namespace}-${backendHttpsRedirectMiddleware.name}${crd},${namespace}-${backendCorsMiddleware.name}${crd},${namespace}-${backendRateLimitMiddleware.name}${crd}`;

console.log("-----------middlewaresLiteral----------");
console.log(middlewaresLiteral);
console.log("------------middlewaresLiteral-----------");

export const backendIngress = new k8s.networking.v1.Ingress(
    "backend-ingress",
    {
        metadata: {
            name: "backend-ingress",
            namespace,
            labels: config.labels.backend,
            annotations: {
                "kubernetes.io/ingress.class": "traefik",
                "cert-manager.io/cluster-issuer": config.issuer,
                "traefik.ingress.kubernetes.io/router.middlewares": middlewaresLiteral,
            },
        },
        spec: {
            tls: [
                {
                    hosts: config.domains,
                    secretName: pulumi.interpolate`${namespace}-tls-cert`,
                },
            ],
            rules: config.domains.map((domain) => ({
                host: domain,
                http: {
                    paths: [
                        {
                            path: "/api",
                            pathType: "Prefix",
                            backend: {
                                service: {
                                    name: backendService.metadata.name,
                                    port: { number: 80 },
                                },
                            },
                        },
                    ],
                },
            })),
        },
    },
    {
        dependsOn: [
            backendNs,
            letsEncryptTest,
            letsEncrypt,
            backendHttpsRedirectMiddleware,
            backendCorsMiddleware,
            backendRateLimitMiddleware,
        ],
    },
);
