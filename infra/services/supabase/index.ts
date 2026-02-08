import * as pulumi from "@pulumi/pulumi";
import { createSupabaseNs } from "./namespace";
import { createSupabaseChart } from "./supabase";
import { createSupabaseIngress } from "./ingress";

export const deploySupabase = (dependsOn: pulumi.Resource[]) => {
    const supabaseNs = createSupabaseNs(dependsOn);
    const supabaseChart = createSupabaseChart(supabaseNs.metadata.name, [supabaseNs, ...dependsOn]);
    const supabaseIngress = createSupabaseIngress(supabaseNs.metadata.name, [supabaseChart]);

    return { supabaseNs, supabaseChart, supabaseIngress };
};
