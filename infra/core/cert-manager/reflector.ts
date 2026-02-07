import * as k8s from "@pulumi/kubernetes";

export const reflector = new k8s.helm.v3.Chart("reflector", {
    chart: "reflector",
    namespace: "kube-system",
    fetchOpts: {
        repo: "https://emberstack.github.io/helm-charts",
    },
});
