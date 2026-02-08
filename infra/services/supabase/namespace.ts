import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

export const createSupabaseNs = (dependsOn: pulumi.Resource[]) => {
    return new k8s.core.v1.Namespace(
        "supabase-service",
        {
            metadata: { name: "supabase-service", labels: { app: "supabase" } },
        },
        { dependsOn },
    );
};
