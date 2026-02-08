import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

export const serviceEnvironemnts =
    config.getObject<Record<string, { enabled: boolean | string }>>("service-environment")!;

export const domains = ["dev.traakt.com", "demo.traakt.com", "traakt.com", "supabase.traakt.com"];
export const issuer = "letsencrypt";
