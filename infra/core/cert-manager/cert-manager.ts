import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as config from "../../shared/config";

let certManagerNs: k8s.core.v1.Namespace;
let certManager: k8s.helm.v3.Chart | undefined;

if (config.vars.createCoreResources) {
    certManagerNs = new k8s.core.v1.Namespace("cert-manager", {
        metadata: { name: "cert-manager" },
    });

    certManager = new k8s.helm.v3.Chart(
        "cert-manager",
        {
            chart: "cert-manager",
            namespace: "cert-manager",
            fetchOpts: { repo: "https://charts.jetstack.io" },
            values: { installCRDs: true },
        },
        {
            dependsOn: certManagerNs,
            // transformations: [
            //     (args) => {
            //         if (
            //             args.type === "kubernetes:admissionregistration.k8s.io/v1:ValidatingWebhookConfiguration" ||
            //             args.type === "kubernetes:admissionregistration.k8s.io/v1:MutatingWebhookConfiguration"
            //         ) {
            //             return {
            //                 props: args.props,
            //                 opts: pulumi.mergeOptions(args.opts, {
            //                     ignoreChanges: ["metadata.annotations", "webhooks[*].clientConfig"],
            //                 }),
            //             };
            //         }
            //         return undefined;
            //     },
            // ],
        },
    );
} else {
    certManagerNs = k8s.core.v1.Namespace.get("cert-manager", "cert-manager");
    certManager = undefined;
}

export { certManager, certManagerNs };
