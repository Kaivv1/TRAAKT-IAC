import * as command from "@pulumi/command";
import * as pulumi from "@pulumi/pulumi";

export const createServicesCertCheckCommand = (dependsOn: pulumi.Resource[]) => {
    return new command.local.Command(
        "services-certificate-check",
        {
            create: `
            echo "Checking if certificate is ready..."
            kubectl wait --for=condition=Ready certificate/tls-cert -n cert-manager --timeout=8m || {
                echo "Certificate check failed!"
                exit 1
            }
            echo "Certificate ready!"
        `,
        },
        { dependsOn },
    );
};

export const createVaultCertCheckCommand = (dependsOn: pulumi.Resource[]) => {
    return new command.local.Command(
        "vault-certificate-check",
        {
            create: `
            echo "Checking if certificate is ready..."
            kubectl wait --for=condition=Ready certificate/tls-vault-cert -n cert-manager --timeout=8m || {
                echo "Certificate check failed!"
                exit 1
            }
            echo "Certificate ready!"
        `,
        },
        { dependsOn },
    );
};

export const createVaultCaCertCheckCommand = (dependsOn: pulumi.Resource[]) => {
    return new command.local.Command(
        "vault-ca-certificate-check",
        {
            create: `
            echo "Checking if certificate is ready..."
            kubectl wait --for=condition=Ready certificate/self-signed-ca -n cert-manager --timeout=8m || {
                echo "Certificate check failed!"
                exit 1
            }
            echo "Certificate ready!"
        `,
        },
        { dependsOn },
    );
};
