import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

export const copyTlsSecretToNamespace = (
    newResourceName: string,
    namespace: string | pulumi.Output<string>,
    dependsOn?: pulumi.Resource[],
): pulumi.Resource => {
    const sourceSecret = k8s.core.v1.Secret.get(`${newResourceName}-source`, "cert-manager/tls-cert-secret", {
        dependsOn,
    });

    return new k8s.core.v1.Secret(
        "backend-tls-secret-demo",
        {
            metadata: {
                name: "tls-cert-secret",
                namespace,
            },
            type: "kubernetes.io/tls",
            data: sourceSecret.data,
        },
        { dependsOn: [sourceSecret, ...(dependsOn || [])] },
    );
};
