import * as command from "@pulumi/command";
import * as pulumi from "@pulumi/pulumi";

export const createCertCheckCommand = (dependsOn: pulumi.Resource[]) => {
    return new command.local.Command(
        "certificate-check",
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
