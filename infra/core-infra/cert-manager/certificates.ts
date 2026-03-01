import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as config from "../../shared/config";

export const createServicesCertificate = (namespace: pulumi.Output<string>, dependsOn: pulumi.Resource[]) => {
    return new k8s.apiextensions.CustomResource(
        "tls-cert",
        {
            apiVersion: "cert-manager.io/v1",
            kind: "Certificate",
            metadata: {
                name: "tls-cert",
                namespace,
            },
            spec: {
                secretName: "tls-cert-secret",
                issuerRef: {
                    name: config.servicesIssuer,
                    kind: "ClusterIssuer",
                },
                dnsNames: config.domains,
                secretTemplate: {
                    annotations: {
                        "reflector.v1.k8s.emberstack.com/reflection-allowed": "true",
                        "reflector.v1.k8s.emberstack.com/reflection-allowed-namespaces":
                            "backend-service-dev,backend-service-demo,vault,postgres-service,redis-service",
                        "reflector.v1.k8s.emberstack.com/reflection-auto-enabled": "true",
                        "reflector.v1.k8s.emberstack.com/reflection-auto-namespaces":
                            "backend-service-dev,backend-service-demo,vault,postgres-service,redis-service",
                    },
                },
            },
        },
        {
            dependsOn,
        },
    );
};

export const createVaultCaCert = (namespace: pulumi.Output<string>, dependsOn: pulumi.Resource[]) => {
    return new k8s.apiextensions.CustomResource("self-signed-ca", {
        apiVersion: "cert-manager.io/v1",
        kind: "Certificate",
        metadata: {
            name: "self-signed-ca",
            namespace,
        },
        spec: {
            isCA: true,
            commonName: "self-signed-ca",
            secretName: "internal-ca-secret",
            privateKey: {
                algorithm: "ECDSA",
                size: 256,
            },
            issuerRef: {
                name: "selfsign-issuer",
                kind: "ClusterIssuer",
                group: "cert-manager.io",
            },
        },
    });
};

export const createVaultCertificate = (namespace: pulumi.Output<string>, dependsOn: pulumi.Resource[]) => {
    return new k8s.apiextensions.CustomResource(
        "tls-cert",
        {
            apiVersion: "cert-manager.io/v1",
            kind: "Certificate",
            metadata: {
                name: "tls-vault-cert",
                namespace,
            },
            spec: {
                secretName: "tls-vault-cert-secret",
                issuerRef: {
                    name: "internal-issuer",
                    kind: "ClusterIssuer",
                },
                dnsNames: [
                    "vault-0.vault-internal",
                    "vault-1.vault-internal",
                    "vault-2.vault-internal",
                    "vault.vault.svc",
                    "vault.vault.svc.cluster.local",
                    "localhost",
                ],
                secretTemplate: {
                    annotations: {
                        "reflector.v1.k8s.emberstack.com/reflection-allowed": "true",
                        "reflector.v1.k8s.emberstack.com/reflection-allowed-namespaces": "vault",
                        "reflector.v1.k8s.emberstack.com/reflection-auto-enabled": "true",
                        "reflector.v1.k8s.emberstack.com/reflection-auto-namespaces": "vault",
                    },
                },
            },
        },
        {
            dependsOn,
        },
    );
};
