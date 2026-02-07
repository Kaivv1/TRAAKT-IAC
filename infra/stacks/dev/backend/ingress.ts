import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { backendNs, labels } from "./namespace";
import { backendService } from "./service";
import { TraefikMiddleware } from "../../../components/traefik.middleware";

const crd = "@kubernetescrd";
const namespace = backendNs.metadata.name;

export const backendHttpsRedirectMiddleware = TraefikMiddleware.createHttpsRedirect(
    "backend-https-redirect-dev",
    namespace,
    labels,
    { dependsOn: backendNs },
);

export const backendCorsMiddleware = TraefikMiddleware.createCors(
    "backend-cors-dev",
    namespace,
    labels,
    ["https://dev.traakt.com"],
    { dependsOn: backendNs },
);

export const backendRateLimitMiddleware = TraefikMiddleware.createRateLimit(
    "backend-rate-limit-dev",
    namespace,
    labels,
    { dependsOn: backendNs },
);

const middlewaresLiteral = pulumi.interpolate`${namespace}-${backendHttpsRedirectMiddleware.name}${crd},${namespace}-${backendCorsMiddleware.name}${crd},${namespace}-${backendRateLimitMiddleware.name}${crd}`;

export const backendIngress = new k8s.networking.v1.Ingress(
    "backend-ingress-dev",
    {
        metadata: {
            name: "backend-ingress-dev",
            namespace,
            labels,
            annotations: {
                "kubernetes.io/ingress.class": "traefik",
                "traefik.ingress.kubernetes.io/router.middlewares": middlewaresLiteral,
            },
        },
        spec: {
            tls: [
                {
                    hosts: ["dev.traakt.com"],
                    secretName: "tls-cert-secret",
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
                                        name: backendService.metadata.name,
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
            backendNs,
            // backendCopiedTlsSecret,
            backendHttpsRedirectMiddleware,
            backendCorsMiddleware,
            backendRateLimitMiddleware,
        ],
    },
);
