import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

export const serviceEnvironments = config.requireObject<Record<string, { enabled: boolean }>>("service-environment");
export const vault = config.requireObject<{ enabled: boolean }>("vault");
export const postgres = config.requireObject<{ enabled: boolean }>("postgres");
// export const secrets = {
//     supabaseJwtSecret: config.requireSecret("supabase_jwt_secret"),
//     supabaseAnonKey: config.requireSecret("supabase_anon_key"),
//     supabaseServiceRoleKey: config.requireSecret("supabase_service_role_key"),
//     supabaseDbName: config.requireSecret("supabase_db_name"),
//     supabaseDbPassword: config.requireSecret("supabase_db_password"),
//     supabaseStudioUsername: config.requireSecret("supabase_studio_username"),
//     supabaseStudioPassword: config.requireSecret("supabase_studio_password"),
// };
export const domains = ["dev.traakt.com", "demo.traakt.com", "traakt.com", "vault.traakt.com"];
export const servicesIssuer = "letsencrypt-issuer";
