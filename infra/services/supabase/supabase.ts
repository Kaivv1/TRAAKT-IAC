import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as config from "../../shared/config";

export const createSupabaseChart = (namespace: pulumi.Output<string>, dependsOn: pulumi.Resource[]) => {
    return new k8s.helm.v3.Release(
        "supabase",
        {
            name: "supabase",
            chart: "supabase",
            namespace,
            waitForJobs: true,
            timeout: 600,
            repositoryOpts: {
                repo: "https://supabase-community.github.io/supabase-kubernetes",
            },
            values: {
                secret: {
                    jwt: {
                        secret: config.secrets.supabaseJwtSecret,
                        anonKey: config.secrets.supabaseAnonKey,
                        serviceKey: config.secrets.supabaseServiceRoleKey,
                    },
                    db: {
                        password: config.secrets.supabaseDbPassword,
                        database: config.secrets.supabaseDbName,
                    },
                    dashboard: {
                        username: config.secrets.supabaseStudioUsername,
                        password: config.secrets.supabaseStudioPassword,
                    },
                },
                db: {
                    enabled: true,
                    persistence: {
                        enabled: true,
                        size: "5Gi",
                    },
                },
                studio: {
                    enabled: true,
                    nameOverride: "studio",
                    environment: {
                        SUPABASE_PUBLIC_URL: "https://supabase.traakt.com",
                    },
                },
                kong: {
                    enabled: true,
                    nameOverride: "kong",
                    ingress: {
                        enabled: false,
                    },
                },
                auth: {
                    enabled: true,
                    nameOverride: "auth",
                    environment: {
                        GOTRUE_SITE_URL: "https://traakt.com",
                        GOTRUE_URI_ALLOW_LIST: "https://*.traakt.com/*,https://traakt.com/*",
                        GOTRUE_API_EXTERNAL_URL: "https://supabase.traakt.com",
                    },
                },
                rest: { enabled: true, nameOverride: "rest" },
                realtime: { enabled: true, nameOverride: "realtime" },
                functions: {
                    enabled: true,
                    nameOverride: "functions",
                    replicaCount: 2,
                    image: {
                        repository: "kaivv1/supabase-functions",
                        pullPolicy: "Always",
                        tag: "latest",
                    },
                    environment: {
                        // SSL mode options: disable, allow, prefer, require, verify-ca, verify-full
                        DB_SSL: "verify-full",
                        VERIFY_JWT: true,
                    },
                },
                storage: {
                    nameOverride: "storage",
                    enabled: true,
                    persistence: {
                        enabled: true,
                        size: "5Gi",
                    },
                },
                meta: { enabled: true, nameOverride: "meta" },
            },
        },
        { dependsOn },
    );
};
