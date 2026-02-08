import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { TraefikMiddleware } from "../../components/traefik.middleware";

export const createBackendIngress = (
    namespace: pulumi.Output<string>,
    backendSvcName: pulumi.Output<string>,
    env: string,
    dependsOn: pulumi.Resource[],
) => {
    const crd = "@kubernetescrd";
    const labels = { app: "backend", environment: env };
    const backendHttpsRedirectMiddleware = TraefikMiddleware.createHttpsRedirect(
        `backend-https-redirect-${env}`,
        namespace,
        labels,
        { dependsOn },
    );

    const backendCorsMiddleware = TraefikMiddleware.createCors(
        `backend-cors-${env}`,
        namespace,
        labels,
        [`https://${env}.traakt.com`],
        { dependsOn },
    );

    const backendRateLimitMiddleware = TraefikMiddleware.createRateLimit(
        `backend-rate-limit-${env}`,
        namespace,
        labels,
        {
            dependsOn,
        },
    );

    const middlewaresLiteral = pulumi.interpolate`${namespace}-${backendHttpsRedirectMiddleware.name}${crd},${namespace}-${backendCorsMiddleware.name}${crd},${namespace}-${backendRateLimitMiddleware.name}${crd}`;

    return new k8s.networking.v1.Ingress(
        `backend-ingress-${env}`,
        {
            metadata: {
                name: `backend-ingress-${env}`,
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
                        hosts: [`${env}.traakt.com`],
                        secretName: "tls-cert-secret",
                    },
                ],
                rules: [
                    {
                        host: `${env}.traakt.com`,
                        http: {
                            paths: [
                                {
                                    path: "/api",
                                    pathType: "Prefix",
                                    backend: {
                                        service: {
                                            name: backendSvcName,
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
                backendHttpsRedirectMiddleware,
                backendCorsMiddleware,
                backendRateLimitMiddleware,
                ...dependsOn,
            ],
        },
    );
};
