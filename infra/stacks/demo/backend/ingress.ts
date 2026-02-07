import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { backendNs, labels } from "./namespace";
import { backendService } from "./service";
import { TraefikMiddleware } from "../../../components/traefik.middleware";

const crd = "@kubernetescrd";
const namespace = backendNs.metadata.name;

// const coreStack = new pulumi.StackReference("core-infra/core");

// const tlsSecretName = coreStack.requireOutput("tlsSecretName");
// const tlsSecretNamespace = coreStack.requireOutput("tlsNamespace");

export const backendHttpsRedirectMiddleware = TraefikMiddleware.createHttpsRedirect(
    "backend-https-redirect-demo",
    namespace,
    labels,
    { dependsOn: backendNs },
);

export const backendCorsMiddleware = TraefikMiddleware.createCors(
    "backend-cors-demo",
    namespace,
    labels,
    ["https://demo.traakt.com"],
    { dependsOn: backendNs },
);

export const backendRateLimitMiddleware = TraefikMiddleware.createRateLimit(
    "backend-rate-limit-demo",
    namespace,
    labels,
    { dependsOn: backendNs },
);

const middlewaresLiteral = pulumi.interpolate`${namespace}-${backendHttpsRedirectMiddleware.name}${crd},${namespace}-${backendCorsMiddleware.name}${crd},${namespace}-${backendRateLimitMiddleware.name}${crd}`;

const sourceSecret = k8s.core.v1.Secret.get(`backend-tls-secret-source-demo`, "cert-manager/tls-cert-secret", {
    dependsOn: backendNs,
});

const backendTlsSecret = new k8s.core.v1.Secret(
    "backend-tls-secret-demo",
    {
        metadata: {
            name: "tls-cert-secret",
            namespace: namespace,
        },
        type: "kubernetes.io/tls",
        data: sourceSecret.data,
    },
    { dependsOn: [backendNs, sourceSecret] },
);

export const backendIngress = new k8s.networking.v1.Ingress(
    "backend-ingress-demo",
    {
        metadata: {
            name: "backend-ingress-demo",
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
                    hosts: ["demo.traakt.com"],
                    secretName: "tls-cert-secret",
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
            backendTlsSecret,
            backendHttpsRedirectMiddleware,
            backendCorsMiddleware,
            backendRateLimitMiddleware,
        ],
    },
);
