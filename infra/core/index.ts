import { certManager, certManagerNs } from "./cert-manager/cert-manager";
import { letsEncrypt, letsEncryptTest } from "./cert-manager/cluster-issuers";
import { waitForCertManager } from "./cert-manager/jobs";
import { certificate } from "./cert-manager/certificate";
import { reflector } from "./cert-manager/reflector";

export const deployed = {
    namespace: certManagerNs.metadata.name,
    certManager: certManager.ready,
    reflector: reflector.ready,
    clusterIssuers: {
        letsEncrypt: letsEncrypt.metadata.name,
        letsEncryptTest: letsEncryptTest.metadata.name,
    },
    jobs: {
        waitForCertManager: waitForCertManager.metadata.name,
    },
    certificate: certificate.metadata.name,
};
