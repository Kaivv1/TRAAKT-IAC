import * as k8s from "@pulumi/kubernetes";
import * as vars from "../../shared/vars";
import { certManagerNs } from "./cert-manager";
import { letsEncrypt, letsEncryptTest } from "./cluster-issuers";
import { reflector } from "./reflector";

export const certificate = new k8s.apiextensions.CustomResource(
    "tls-cert",
    {
        apiVersion: "cert-manager.io/v1",
        kind: "Certificate",
        metadata: {
            name: "tls-cert",
            namespace: certManagerNs.metadata.name,
        },
        spec: {
            secretName: "tls-cert-secret",
            issuerRef: {
                name: vars.issuer,
                kind: "ClusterIssuer",
            },
            dnsNames: vars.domains,
            secretTemplate: {
                annotations: {
                    "reflector.v1.k8s.emberstack.com/reflection-allowed": "true",
                    "reflector.v1.k8s.emberstack.com/reflection-allowed-namespaces":
                        "backend-service-dev,backend-service-demo",
                    "reflector.v1.k8s.emberstack.com/reflection-auto-enabled": "true",
                    "reflector.v1.k8s.emberstack.com/reflection-auto-namespaces":
                        "backend-service-dev,backend-service-demo",
                },
            },
        },
    },
    {
        dependsOn: [reflector, letsEncrypt, letsEncryptTest],
    },
);
