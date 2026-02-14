import * as config from "./shared/config";
import * as command from "@pulumi/command";
import { deployCertManager } from "./core-infra/cert-manager";
import { deployBackendService } from "./services/backend";
import { deployVault } from "./core-infra/vault";

const { certificate } = deployCertManager();
const certificateCheck = new command.local.Command(
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
    { dependsOn: certificate },
);

deployVault([certificateCheck]);

for (const [env, conf] of Object.entries(config.serviceEnvironemnts)) {
    if (!conf.enabled) continue;
    deployBackendService(env, [certificateCheck]);
}
