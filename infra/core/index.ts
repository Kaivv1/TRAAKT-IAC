import { certManagerNs } from "./cert-manager/cert-manager";
import { letsEncrypt, letsEncryptTest } from "./cert-manager/cluster-issuers";
import { certificate } from "./cert-manager/certificate";

export const deployed = {
    namespace: certManagerNs.metadata.name,
    certManager: "chart deployed",
    reflector: "chart deployed",
    clusterIssuers: {
        letsEncrypt: letsEncrypt.metadata.name,
        letsEncryptTest: letsEncryptTest.metadata.name,
    },
    certificate: certificate.metadata.name,
};
