import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

export const createTrustInternalCert = (namespace: pulumi.Output<string>, dependsOn: pulumi.Resource[]) => {
    return new k8s.apiextensions.CustomResource(
        "vault-transport",
        {
            apiVersion: "traefik.io/v1alpha1",
            kind: "ServersTransport",
            metadata: { name: "vault-transport", namespace },
            spec: {
                serverName: "vault.vault.svc",
                rootCAsSecrets: ["tls-vault-cert-secret"],
            },
        },
        { dependsOn },
    );
};
