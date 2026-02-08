import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { TraefikMiddleware } from "../../components/traefik.middleware";

export const createSupabaseIngress = (namespace: pulumi.Output<string>, dependsOn: pulumi.Resource[]) => {
    const crd = "@kubernetescrd";
    const labels = { app: "supabase" };

    const supabaseHttpsRedirectMiddleware = TraefikMiddleware.createHttpsRedirect(
        "supabase-https-redirect",
        namespace,
        labels,
        { dependsOn },
    );

    const middlewaresLiteral = pulumi.interpolate`${namespace}-${supabaseHttpsRedirectMiddleware.name}${crd}`;

    return new k8s.networking.v1.Ingress(
        "supabase-ingress",
        {
            metadata: {
                name: "supabase-ingress",
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
                        hosts: ["supabase.traakt.com"],
                        secretName: "tls-cert-secret",
                    },
                ],
                rules: [
                    {
                        host: "supabase.traakt.com",
                        http: {
                            paths: [
                                {
                                    path: "/",
                                    pathType: "Prefix",
                                    backend: {
                                        service: {
                                            name: "supabase-kong",
                                            port: { number: 8000 },
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
            dependsOn,
        },
    );
};
