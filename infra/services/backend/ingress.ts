import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as config from "../../shared/config";
import { backendNs } from "./namespace";
import { letsEncrypt, letsEncryptTest, copyTlsSecretToNamespace } from "../../core/cert-manager";
import { TraefikMiddleware } from "../../components/traefik.middleware";
import { backendService } from "./service";

const crd = "@kubernetescrd";
const namespace = backendNs.metadata.name;
const environment = config.vars.environment;
export const backendHttpsRedirectMiddleware = TraefikMiddleware.createHttpsRedirect(
    `backend-https-redirect-${environment}`,
    namespace,
    config.labels.backend,
);

export const backendCorsMiddleware = TraefikMiddleware.createCors(
    `backend-cors-${environment}`,
    namespace,
    config.labels.backend,
    [`https://${environment}.traakt.com`],
);

export const backendRateLimitMiddleware = TraefikMiddleware.createRateLimit(
    `backend-rate-limit-${environment}`,
    namespace,
    config.labels.backend,
);

const middlewaresLiteral = pulumi.interpolate`${namespace}-${backendHttpsRedirectMiddleware.name}${crd},${namespace}-${backendCorsMiddleware.name}${crd},${namespace}-${backendRateLimitMiddleware.name}${crd}`;

const backendTlsSecret = copyTlsSecretToNamespace(`backend-tls-secret-${environment}`, namespace, [
    backendNs,
]) as pulumi.Input<pulumi.Resource>;

export const backendIngress = new k8s.networking.v1.Ingress(
    `backend-ingress-${environment}`,
    {
        metadata: {
            name: `backend-ingress-${environment}`,
            namespace,
            labels: config.labels.backend,
            annotations: {
                "kubernetes.io/ingress.class": "traefik",
                // "cert-manager.io/cluster-issuer": config.issuer,
                "traefik.ingress.kubernetes.io/router.middlewares": middlewaresLiteral,
            },
        },
        spec: {
            tls: [
                {
                    hosts: [`${environment}.traakt.com`],
                    secretName: "tls-cert-secret",
                },
            ],
            rules: [
                {
                    host: `${environment}.traakt.com`,
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
            letsEncryptTest,
            letsEncrypt,
            backendTlsSecret,
            backendHttpsRedirectMiddleware,
            backendCorsMiddleware,
            backendRateLimitMiddleware,
        ],
        protect: true,
    },
);
