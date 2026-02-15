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
                            until vault status 2>/dev/null; do
                                sleep 5
                            done

                            if [ ! -f /vault-init/vault-init.json ]; then
                                vault operator init -key-shares=5 -key-threshold=3 -format=json > /vault-init/vault-init.json
                            fi
                            sleep infinity
                            `,
                        ],
                        env: [
                            {
                                name: "VAULT_ADDR",
                                value: "http://vault-0.vault-internal:8200",
                            },
                        ],
                        volumeMounts: [
                            {
                                name: "init-vault-storage",
                                mountPath: "/vault-init",
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
                ],
            },
        },
        { dependsOn: [initPvc] },
    );

    return { initStoragePod };
};
