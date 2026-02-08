import * as k8s from "@pulumi/kubernetes";

export const createSupabaseNs = () => {
    return new k8s.core.v1.Namespace("supabase-service", {
        metadata: { name: "supabase-service", labels: { app: "supabase" } },
    });
};
