import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();
const stack = pulumi.getStack();

const stackNamespace = new k8s.core.v1.Namespace(stack, {
    metadata: {
        name: stack,
        labels: { name: stack },
    },
});
const provider = new k8s.Provider(`${stack}-provider`, {
    namespace: stack,
});

const cert = new k8s.apiextensions.CustomResource(
    "my-cert",
    {
        apiVersion: "cert-manager.io/v1",
        kind: "Certificate",
        metadata: {
            name: "my-cert",
            namespace: "default",
        },
        spec: {
            secretName: "my-cert-tls",
            issuerRef: {
                name: "letsencrypt-prod",
                kind: "ClusterIssuer",
            },
            dnsNames: ["traakt.com", "www.traakt.com"],
        },
    },
    { provider },
);

// const appLabels = { app: "nginx" };
// const nginxDeployment = new k8s.apps.v1.Deployment(
//     "nginx",
//     {
//         spec: {
//             selector: { matchLabels: appLabels },
//             replicas: 2,
//             template: {
//                 metadata: { labels: appLabels },
//                 spec: {
//                     containers: [
//                         {
//                             name: "nginx",
//                             image: "nginxdemos/hello:latest",
//                             ports: [
//                                 {
//                                     containerPort: 80,
//                                     name: "nginx-port",
//                                 },
//                             ],
//                         },
//                     ],
//                 },
//             },
//         },
//     },
//     { provider, dependsOn: stackNamespace },
// );

// const nginxService = new k8s.core.v1.Service(
//     "nginx-service",
//     {
//         spec: {
//             type: "NodePort",
//             selector: appLabels,
//             ports: [{ targetPort: "nginx-port", port: 80 }],
//         },
//     },
//     { provider, dependsOn: stackNamespace },
// );

export const stackNamespaceName = stackNamespace.metadata.name;
export const certName = cert.metadata.name;
// export const deploymentName = nginxDeployment.metadata.name;
// export const serviceName = nginxService.metadata.name;
