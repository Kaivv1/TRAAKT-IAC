import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();
const stack = pulumi.getStack();

// const provider = new k8s.Provider("provider", {});
const stackNamespace = new k8s.core.v1.Namespace(stack, {
    metadata: {
        name: stack,
        labels: { name: stack },
    },
});

export const stackNamespaceName = stackNamespace.metadata.name;

// const appLabels = { app: "nginx" };
// const deployment = new k8s.apps.v1.Deployment("nginx", {
//     spec: {
//         selector: { matchLabels: appLabels },
//         replicas: 2,
//         template: {
//             metadata: { labels: appLabels },
//             spec: { containers: [{ name: "nginx", image: "nginxdemos/hello:latest" }] },
//         },
//     },
// });
// export const name = deployment.metadata.name;
