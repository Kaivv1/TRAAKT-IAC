import { createCertManagerChart, createCertManagerNs } from "./cert-manager";
import { createCertificate } from "./certificate";
import { createLetsEncrypt } from "./cluster-issuers";
import { createReflectorChart } from "./reflector";

export const deployCertManager = () => {
    const certManagerNs = createCertManagerNs();
    const certManager = createCertManagerChart([certManagerNs]);
    const reflector = createReflectorChart();
    const letsEncrypt = createLetsEncrypt([certManager]);
    const certificate = createCertificate(certManagerNs.metadata.name, [reflector, letsEncrypt]);

    return { certManagerNs, certManager, reflector, letsEncrypt, certificate };
};
