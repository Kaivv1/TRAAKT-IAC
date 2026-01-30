import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as config from "../../shared/config";
import { certManager, certManagerNs } from "./cert-manager";
import { waitForCertificate, waitForCertManager } from "./jobs";
import { letsEncrypt, letsEncryptTest } from "./cluster-issuers";

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
                name: config.issuer,
                kind: "ClusterIssuer",
            },
            dnsNames: config.vars.domains,
        },
    },
    {
        dependsOn: [certManagerNs, certManager, waitForCertManager, letsEncrypt, letsEncryptTest],
    },
);

export function copyTlsSecretToNamespace(
    resourceName: string,
    targetNamespace: pulumi.Input<string>,
    dependsOn?: pulumi.Input<pulumi.Resource>[],
): k8s.core.v1.Secret {
    const sourceSecret = k8s.core.v1.Secret.get(
        `${resourceName}-source`,
        pulumi.interpolate`cert-manager/tls-cert-secret`,
        { dependsOn: waitForCertificate },
    );

    return new k8s.core.v1.Secret(
        resourceName,
        {
            metadata: {
                name: "tls-cert",
                namespace: targetNamespace,
            },
            type: "kubernetes.io/tls",
            data: sourceSecret.data,
        },
        {
            dependsOn: [waitForCertificate, ...(dependsOn || [])],
        },
    );
}
