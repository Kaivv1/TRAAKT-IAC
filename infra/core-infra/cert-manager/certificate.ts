import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as config from "../../shared/config";

export const createCertificate = (namespace: pulumi.Output<string>, dependsOn: pulumi.Resource[]) => {
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
                    name: config.issuer,
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
