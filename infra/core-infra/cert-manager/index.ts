import * as commnad from "@pulumi/command";
import { createCertManagerChart, createCertManagerNs } from "./cert-manager";
import { createCertificate } from "./certificate";
import { createLetsEncrypt } from "./cluster-issuers";
import { createReflectorChart } from "./reflector";

export const deployCertManager = () => {
    const certManagerNs = createCertManagerNs();
    const certManager = createCertManagerChart([certManagerNs]);
    const reflector = createReflectorChart();
    const checkCertManagerAvailability = new commnad.local.Command(
        "cert-manager-check",
        {
            create: `
            echo "Checking cert manager availability..."
            kubectl wait --for=condition=Available deployment/cert-manager -n cert-manager --timeout=5m
            kubectl wait --for=condition=Available deployment/cert-manager-webhook -n cert-manager --timeout=5m
            kubectl wait --for=condition=Available deployment/cert-manager-cainjector -n cert-manager --timeout=5m
            `,
        },
        { dependsOn: [certManager] },
    );
    const letsEncrypt = createLetsEncrypt([checkCertManagerAvailability]);
    const certificate = createCertificate(certManagerNs.metadata.name, [reflector, letsEncrypt]);

    return { certManagerNs, certManager, reflector, letsEncrypt, certificate };
};
