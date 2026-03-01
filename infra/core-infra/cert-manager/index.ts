import * as commnad from "@pulumi/command";
import { createCertManagerChart, createCertManagerNs } from "./cert-manager";
import { createServicesCertificate, createVaultCaCert, createVaultCertificate } from "./certificates";
import { createLetsEncryptTest, createInternalIssuer, createSelfSignIssuer } from "./cluster-issuers";
import { createReflectorChart } from "./reflector";
import {
    createServicesCertCheckCommand,
    createVaultCaCertCheckCommand,
    createVaultCertCheckCommand,
} from "./cert-check-command";

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
    const letsEncryptIssuer = createLetsEncryptTest([checkCertManagerAvailability]);
    const selfSignIssuer = createSelfSignIssuer([checkCertManagerAvailability]);
    const servicesCertificate = createServicesCertificate(certManagerNs.metadata.name, [reflector, letsEncryptIssuer]);
    const vaultCaCertificate = createVaultCaCert(certManagerNs.metadata.name, [selfSignIssuer]);
    const vaultCaCertCheckCommand = createVaultCaCertCheckCommand([vaultCaCertificate]);
    const internalIssuer = createInternalIssuer([vaultCaCertCheckCommand]);
    const vaultCertificate = createVaultCertificate(certManagerNs.metadata.name, [internalIssuer]);
    const servicesCertCheckCommand = createServicesCertCheckCommand([servicesCertificate]);
    const vaultCertCheckCommand = createVaultCertCheckCommand([vaultCertificate]);

    return {
        certManagerNs,
        certManager,
        reflector,
        letsEncryptIssuer,
        servicesCertificate,
        servicesCertCheckCommand,
        vaultCertCheckCommand,
        selfSignIssuer,
        internalIssuer,
    };
};
