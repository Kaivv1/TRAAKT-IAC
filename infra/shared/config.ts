import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

export const serviceEnvironemnts =
    config.requireObject<Record<string, { enabled: boolean | string }>>("service-environment");
export const supabase = config.requireObject<Record<string, { enabled: boolean | string }>>("supabase");
console.log("------supabase env variable------");
console.log(supabase);
console.log("------supabase env variable------");
export const secrets = {
    supabaseJwtSecret: config.requireSecret("supabase_jwt_secret"),
    supabaseAnonKey: config.requireSecret("supabase_anon_key"),
    supabaseServiceRoleKey: config.requireSecret("supabase_service_role_key"),
    supabaseDbName: config.requireSecret("supabase_db_name"),
    supabaseDbPassword: config.requireSecret("supabase_db_password"),
    supabaseStudioUsername: config.requireSecret("supabase_studio_username"),
    supabaseStudioPassword: config.requireSecret("supabase_studio_password"),
};
export const domains = ["dev.traakt.com", "demo.traakt.com", "traakt.com", "supabase.traakt.com"];
export const issuer = "letsencrypt";
