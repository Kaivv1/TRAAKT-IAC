// import * as k8s from "@pulumi/kubernetes";
// import * as pulumi from "@pulumi/pulumi";
// import { supabaseNs, labels } from "./namespace";
// import { TraefikMiddleware } from "../../../components/traefik.middleware";
// import { copyTlsSecretToNamespace } from "../../../components/copyTlsSecret";

// const crd = "@kubernetescrd";
// const namespace = supabaseNs.metadata.name;

// export const supabaseHttpsRedirectMiddleware = TraefikMiddleware.createHttpsRedirect(
//     "supabase-https-redirect-dev",
//     namespace,
//     labels,
//     { dependsOn: supabaseNs },
// );

// const middlewaresLiteral = pulumi.interpolate`${namespace}-${supabaseHttpsRedirectMiddleware.name}${crd}`;

// const backendCopiedTlsSecret = copyTlsSecretToNamespace("tls-cert-secret-dev", namespace, [supabaseNs]);

// export const supabaseIngress = new k8s.networking.v1.Ingress(
//     "supabase-ingress-dev",
//     {
//         metadata: {
//             name: "supabase-ingress-dev",
//             namespace: supabaseNs.metadata.name,
//             labels,
//             annotations: {
//                 "kubernetes.io/ingress.class": "traefik",
//                 "traefik.ingress.kubernetes.io/router.middlewares": middlewaresLiteral,
//             },
//         },
//         spec: {
//             tls: [
//                 {
//                     hosts: ["dev.traakt.com"],
//                     secretName: "tls-cert-secret",
//                 },
//             ],
//             rules: [
//                 {
//                     host: "dev.traakt.com",
//                     http: {
//                         paths: [
//                             {
//                                 path: "/api",
//                                 pathType: "Prefix",
//                                 backend: {
//                                     service: {
//                                         name: backendService.metadata.name,
//                                         port: { number: 80 },
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
//         dependsOn: [backendNs],
//     },
// );
