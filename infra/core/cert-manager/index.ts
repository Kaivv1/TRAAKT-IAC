import { certManagerNs } from "./cert-manager";
import { letsEncryptTest, letsEncrypt } from "./cluster-issuers";
import { waitForCertManager } from "./jobs";

const info = {
    namespace: certManagerNs.metadata.name,
    clusterIssuers: {
        letsEncrypt: letsEncrypt.metadata.name,
        letsEncryptTest: letsEncryptTest.metadata.name,
    },
    jobs: {
        waitForCertManager: waitForCertManager.metadata.name,
    },
    certManagerChart: "cert-manager",
};

export { letsEncrypt, letsEncryptTest, info };
