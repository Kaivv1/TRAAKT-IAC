import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();
const stack = pulumi.getStack();

const certManagerNs = new k8s.core.v1.Namespace("cert-manager", {
    metadata: { name: "cert-manager" },
});

const certManager = new k8s.helm.v3.Chart(
    "cert-manager",
    {
        chart: "cert-manager",
        namespace: "cert-manager",
        fetchOpts: { repo: "https://charts.jetstack.io" },
        values: { installCRDs: true },
    },
    { dependsOn: certManagerNs },
);

const waitForCertManager = new k8s.batch.v1.Job(
    "wait-cert-manager",
    {
        metadata: { namespace: "cert-manager" },
        spec: {
            template: {
                spec: {
                    containers: [
                        {
                            name: "wait",
                            image: "busybox:latest",
                            command: ["sh", "-c", "sleep 60"],
                        },
                    ],
                    restartPolicy: "Never",
                },
            },
        },
    },
    { dependsOn: certManager },
);

const letsEncryptStaging = new k8s.apiextensions.CustomResource(
    "letsencrypt-staging",
    {
        apiVersion: "cert-manager.io/v1",
        kind: "ClusterIssuer",
        metadata: { name: "letsencrypt-staging" },
        spec: {
            acme: {
                server: "https://acme-staging-v02.api.letsencrypt.org/directory",
                email: "gigoo2442@gmail.com",
                privateKeySecretRef: { name: "letsencrypt-staging-key" },
                solvers: [{ http01: { ingress: { class: "traefik" } } }],
            },
        },
    },
    { dependsOn: waitForCertManager },
);

const letsEncryptProd = new k8s.apiextensions.CustomResource(
    "letsencrypt-prod",
    {
        apiVersion: "cert-manager.io/v1",
        kind: "ClusterIssuer",
        metadata: { name: "letsencrypt-prod" },
        spec: {
            acme: {
                server: "https://acme-v02.api.letsencrypt.org/directory",
                email: "gigoo2442@gmail.com",
                privateKeySecretRef: { name: "letsencrypt-prod-key" },
                solvers: [{ http01: { ingress: { class: "traefik" } } }],
            },
        },
    },
    { dependsOn: waitForCertManager },
);

const stackNs = new k8s.core.v1.Namespace(stack, {
    metadata: { name: stack },
});

const provider = new k8s.Provider(`${stack}-provider`, {
    namespace: stack,
});

const appLabels = { app: "nginx", environment: stack };

const nginxDeployment = new k8s.apps.v1.Deployment(
    "nginx",
    {
        spec: {
            selector: { matchLabels: appLabels },
            replicas: 2,
            template: {
                metadata: { labels: appLabels },
                spec: {
                    containers: [
                        {
                            name: "nginx",
                            image: "nginxdemos/hello:latest",
                            ports: [{ containerPort: 80 }],
                        },
                    ],
                },
            },
        },
    },
    { provider, dependsOn: stackNs },
);

const nginxService = new k8s.core.v1.Service(
    "nginx-svc",
    {
        spec: {
            type: "ClusterIP",
            selector: appLabels,
            ports: [{ port: 80, targetPort: 80 }],
        },
    },
    { provider },
);

const issuer = stack === "prod" ? "letsencrypt-prod" : "letsencrypt-staging";
const domains = stack === "prod" ? ["traakt.com", "www.traakt.com"] : [`${stack}.traakt.com`];

const nginxIngress = new k8s.networking.v1.Ingress(
    "nginx-ingress",
    {
        metadata: {
            annotations: {
                "kubernetes.io/ingress.class": "traefik",
                "cert-manager.io/cluster-issuer": issuer,
                "traefik.ingress.kubernetes.io/redirect-entry-point": "https",
                "traefik.ingress.kubernetes.io/redirect-permanent": "true",
            },
        },
        spec: {
            tls: [
                {
                    hosts: domains,
                    secretName: `${stack}-tls-cert`,
                },
            ],
            rules: domains.map((domain) => ({
                host: domain,
                http: {
                    paths: [
                        {
                            path: "/",
                            pathType: "Prefix",
                            backend: {
                                service: {
                                    name: nginxService.metadata.name,
                                    port: { number: 80 },
                                },
                            },
                        },
                    ],
                },
            })),
        },
    },
    { provider, dependsOn: [letsEncryptStaging, letsEncryptProd] },
);

export const nginxDeploymentName = nginxDeployment.metadata.name;
export const nginxSvcName = nginxService.metadata.name;
export const nginxIngressName = nginxIngress.metadata.name;
export const urls = domains;
export const issuerUsed = issuer;
export const nsName = stackNs.metadata.name;
