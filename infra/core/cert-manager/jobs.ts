import * as k8s from "@pulumi/kubernetes";
import { certManager, certManagerNs } from "./cert-manager";

export const waitServiceAccount = new k8s.core.v1.ServiceAccount(
    "wait-cert-manager-sa",
    {
        metadata: {
            name: "wait-cert-manager-sa",
            namespace: certManagerNs.metadata.name,
        },
    },
    { dependsOn: certManagerNs },
);

export const waitRole = new k8s.rbac.v1.Role(
    "wait-cert-manager-role",
    {
        metadata: {
            name: "wait-cert-manager-role",
            namespace: certManagerNs.metadata.name,
        },
        rules: [
            {
                apiGroups: ["apps"],
                resources: ["deployments"],
                verbs: ["get", "list", "watch"],
            },
        ],
    },
    { dependsOn: certManagerNs },
);

export const waitRoleBinding = new k8s.rbac.v1.RoleBinding(
    "wait-cert-manager-rolebinding",
    {
        metadata: {
            name: "wait-cert-manager-rolebinding",
            namespace: certManagerNs.metadata.name,
        },
        subjects: [
            {
                kind: "ServiceAccount",
                name: waitServiceAccount.metadata.name,
                namespace: certManagerNs.metadata.name,
            },
        ],
        roleRef: {
            kind: "Role",
            name: waitRole.metadata.name,
            apiGroup: "rbac.authorization.k8s.io",
        },
    },
    { dependsOn: [waitServiceAccount, waitRole] },
);

export const waitForCertManager = new k8s.batch.v1.Job(
    "wait-cert-manager",
    {
        metadata: {
            name: "wait-cert-manager",
            namespace: certManagerNs.metadata.name,
        },
        spec: {
            backoffLimit: 10,
            template: {
                spec: {
                    serviceAccountName: waitServiceAccount.metadata.name,
                    containers: [
                        {
                            name: "wait",
                            image: "bitnami/kubectl:1.31",
                            command: [
                                "sh",
                                "-c",
                                `
                                set -e
                                echo "Waiting for cert-manager deployments to be available..."
                                
                                kubectl wait --for=condition=Available \
                                    deployment/cert-manager \
                                    -n cert-manager \
                                    --timeout=5m
                                
                                kubectl wait --for=condition=Available \
                                    deployment/cert-manager-webhook \
                                    -n cert-manager \
                                    --timeout=5m
                                
                                kubectl wait --for=condition=Available \
                                    deployment/cert-manager-cainjector \
                                    -n cert-manager \
                                    --timeout=5m
                                
                                echo "All deployments are Available"
                                echo "Waiting 40 seconds for webhook to be fully functional..."
                                sleep 40
                                
                                echo "cert-manager webhook is ready!"
                                `,
                            ],
                        },
                    ],
                    restartPolicy: "Never",
                },
            },
        },
    },
    { dependsOn: [certManager, waitRoleBinding] },
);
