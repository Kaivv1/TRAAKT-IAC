import { certManagerNs } from "./cert-manager/cert-manager";
import { letsEncrypt, letsEncryptTest } from "./cert-manager/cluster-issuers";
import { waitForCertManager } from "./cert-manager/jobs";
import { certificate } from "./cert-manager/certificate";

export const deployed = {
    namespace: certManagerNs.metadata.name,
    certManager: "cert-manager",
    clusterIssuers: {
        letsEncrypt: letsEncrypt.metadata.name,
        letsEncryptTest: letsEncryptTest.metadata.name,
    },
    jobs: {
        waitForCertManager: waitForCertManager.metadata.name,
    },
    certificate: certificate.metadata.name,
};

export const tlsSecretName = "tls-cert-secret";
export const tlsNamespace = certManagerNs.metadata.name;
