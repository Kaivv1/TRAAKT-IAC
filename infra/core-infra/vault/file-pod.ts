import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

export const createPersistentFilePod = (namespace: pulumi.Output<string>, dependsOn: pulumi.Resource[]) => {
    const initPvc = new k8s.core.v1.PersistentVolumeClaim(
        "init-vault-storage",
        {
            metadata: { name: "init-vault-storage", namespace },
            spec: {
                accessModes: ["ReadWriteOnce"],
                resources: {
                    requests: {
                        storage: "90Mi",
                    },
                },
            },
        },
        { dependsOn },
    );

    const initStoragePod = new k8s.core.v1.Pod(
        "init-pod",
        {
            metadata: { name: "init-pod", namespace },
            spec: {
                restartPolicy: "OnFailure",
                containers: [
                    {
                        name: "init-storage",
                        image: "hashicorp/vault",
                        command: ["/bin/sh", "-c"],
                        args: [
                            `
                            vault operator init -key-shares=5 -key-threshold=3 -format=json > /vault-init/vault-init.json
                            sleep infinity
                            `,
                        ],
                        env: [
                            {
                                name: "VAULT_ADDR",
                                value: "https://vault-0.vault-internal:8200",
                            },
                            {
                                name: "VAULT_CACERT",
                                value: "/vault/userconfig/vault-tls/ca.crt",
                            },
                        ],
                        volumeMounts: [
                            {
                                name: "init-vault-storage",
                                mountPath: "/vault-init",
                            },
                            {
                                name: "vault-tls",
                                mountPath: "/vault/userconfig/vault-tls",
                                readOnly: true,
                            },
                        ],
                    },
                ],
                volumes: [
                    {
                        name: "init-vault-storage",
                        persistentVolumeClaim: {
                            claimName: initPvc.metadata.name,
                        },
                    },
                    {
                        name: "vault-tls",
                        secret: {
                            secretName: "tls-vault-cert-secret",
                        },
                    },
                ],
            },
        },
        { dependsOn: [initPvc] },
    );

    return { initStoragePod };
};
