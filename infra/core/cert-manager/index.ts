import { certManagerNs, certManager } from "./cert-manager";
import { letsEncryptTest, letsEncrypt } from "./cluster-issuers";
import { waitForCertManager } from "./jobs";
import { certificate, copyTlsSecretToNamespace } from "./certificate";

export const info = {
    namespace: certManagerNs.metadata?.name,
    certManager: "cert-manager",
    clusterIssuers: {
        letsEncrypt: letsEncrypt.metadata?.name,
        letsEncryptTest: letsEncryptTest.metadata?.name,
    },
    jobs: {
        waitForCertManager: waitForCertManager.metadata?.name,
    },
    certificate: certificate.metadata.name,
};

export {
    certManagerNs,
    letsEncrypt,
    letsEncryptTest,
    waitForCertManager,
    certManager,
    certificate,
    copyTlsSecretToNamespace,
};
