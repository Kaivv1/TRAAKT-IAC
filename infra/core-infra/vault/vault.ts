import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

export const createVaultChart = (namespace: pulumi.Output<string>, dependsOn: pulumi.Resource[]) => {
    return new k8s.helm.v3.Release(
        "vault",
        {
            name: "vault",
            chart: "vault",
            namespace,
            repositoryOpts: { repo: "https://helm.releases.hashicorp.com" },
            waitForJobs: true,
            timeout: 400,
            values: {
                global: {
                    enabled: true,
                    tlsDisable: false,
                    externalVaultAddr: "https://vault.vault.svc:8200",
                },
                injector: {
                    enabled: true,
                    replicas: 2,
                    serviceAccount: {
                        create: true,
                        name: "vault-agent-injector",
                        annotations: {},
                    },
                    resources: {
                        requests: {
                            memory: "128Mi",
                            cpu: "150m",
                        },
                        limits: {
                            memory: "256Mi",
                            cpu: "250m",
                        },
                    },
                    tolerations: [],
                    nodeSelector: {
                        "node-role.kubernetes.io/master": undefined,
                    },
                    affinity: {
                        nodeAffinity: {
                            requiredDuringSchedulingIgnoredDuringExecution: {
                                nodeSelectorTerms: [
                                    {
                                        matchExpressions: [
                                            {
                                                key: "node-role.kubernetes.io/master",
                                                operator: "DoesNotExist",
                                            },
                                        ],
                                    },
                                ],
                            },
                        },
                        podAntiAffinity: {
                            preferredDuringSchedulingIgnoredDuringExecution: [
                                {
                                    weight: 100,
                                    podAffinityTerm: {
                                        labelSelector: {
                                            matchLabels: {
                                                "app.kubernetes.io/name": "vault-agent-injector",
                                                component: "webhook",
                                            },
                                        },
                                        topologyKey: "kubernetes.io/hostname",
                                    },
                                },
                            ],
                        },
                    },
                },
                server: {
                    image: {
                        repository: "hashicorp/vault",
                        pullPolicy: "IfNotPresent",
                    },
                    serviceAccount: {
                        create: true,
                        name: "vault",
                        annotations: {},
                    },
                    resources: {
                        requests: {
                            memory: "250Mi",
                            cpu: "250m",
                        },
                        limits: {
                            memory: "500Mi",
                            cpu: "500m",
                        },
                    },
                    volumes: [{ name: "vault-tls", secret: { secretName: "tls-vault-cert-secret" } }],
                    volumeMounts: [{ name: "vault-tls", mountPath: "/vault/userconfig/vault-tls", readOnly: true }],
                    updateStrategyType: "OnDelete",
                    ha: {
                        enabled: true,
                        replicas: 3,
                        raft: {
                            enabled: true,
                            setNodeId: true,
                            config: `
                                ui = true

                                listener "tcp" {
                                    address = "[::]:8200"
                                    cluster_address = "[::]:8201"
                                    tls_cert_file = "/vault/userconfig/vault-tls/tls.crt"
                                    tls_key_file  = "/vault/userconfig/vault-tls/tls.key"
                                }

                                storage "raft" {
                                    path = "/vault/data"
                                    
                                    retry_join {
                                        leader_api_addr = "https://vault-0.vault-internal:8200"
                                        leader_ca_cert_file = "/vault/userconfig/vault-tls/ca.crt"
                                    }
                                    
                                    retry_join {
                                        leader_api_addr = "https://vault-1.vault-internal:8200"
                                        leader_ca_cert_file = "/vault/userconfig/vault-tls/ca.crt"
                                    }
                                    
                                    retry_join {
                                        leader_api_addr = "https://vault-2.vault-internal:8200"
                                        leader_ca_cert_file = "/vault/userconfig/vault-tls/ca.crt"
                                    }
                                    
                                    performance_multiplier = 1
                                }

                                service_registration "kubernetes" {}

                                telemetry {
                                    prometheus_retention_time = "30s"
                                    disable_hostname = true
                                }

                                disable_mlock = true
                                `,
                        },
                    },
                    dataStorage: {
                        enabled: true,
                        size: "1Gi",
                        storageClass: null,
                        accessMode: "ReadWriteOnce",
                    },

                    auditStorage: {
                        enabled: true,
                        size: "1Gi",
                        storageClass: null,
                        accessMode: "ReadWriteOnce",
                    },
                    service: {
                        enabled: true,
                        type: "ClusterIP",
                        port: 8200,
                        targetPort: 8200,
                    },
                    livenessProbe: {
                        enabled: true,
                        path: "/v1/sys/health?standbyok=true",
                        initialDelaySeconds: 60,
                        periodSeconds: 5,
                        timeoutSeconds: 3,
                        failureThreshold: 3,
                    },
                    readinessProbe: {
                        enabled: true,
                        path: "/v1/sys/health?standbyok=true&sealedcode=204&uninitcode=204",
                        initialDelaySeconds: 5,
                        periodSeconds: 5,
                        timeoutSeconds: 3,
                        failureThreshold: 3,
                    },
                    ingress: {
                        enabled: false,
                    },
                    affinity: {
                        nodeAffinity: {
                            requiredDuringSchedulingIgnoredDuringExecution: {
                                nodeSelectorTerms: [
                                    {
                                        matchExpressions: [
                                            {
                                                key: "node-role.kubernetes.io/master",
                                                operator: "DoesNotExist",
                                            },
                                        ],
                                    },
                                ],
                            },
                        },
                        podAntiAffinity: {
                            requiredDuringSchedulingIgnoredDuringExecution: [
                                {
                                    labelSelector: {
                                        matchLabels: {
                                            "app.kubernetes.io/name": "vault",
                                            "app.kubernetes.io/instance": "vault",
                                            component: "server",
                                        },
                                    },
                                    topologyKey: "kubernetes.io/hostname",
                                },
                            ],
                        },
                    },
                    tolerations: [],
                    nodeSelector: {},
                },
                ui: {
                    enabled: true,
                    serviceType: "ClusterIP",
                    externalPort: 8200,
                },
            },
        },
        { dependsOn },
    );
};
