// import * as k8s from "@pulumi/kubernetes";
// import { supabaseNs } from "./namespace";

// export const supabaseDev = new k8s.helm.v3.Chart(
//     "supabase-dev",
//     {
//         chart: "supabase",
//         namespace: supabaseNs.metadata.name,
//         fetchOpts: {
//             repo: "https://supabase.github.io/supabase-kubernetes",
//         },
//         values: {
//             secret: {
//                 db: {
//                     password: "",
//                     database: "postgres",
//                 },
//                 dashboard: {
//                     username: "admin",
//                     password: "1234",
//                 },
//             },
//             db: {
//                 enabled: true,
//                 persistence: {
//                     enabled: true,
//                     size: "5Gi",
//                 },
//             },
//             studio: {
//                 enabled: true,
//                 environment: {
//                     SUPABASE_URL: "https://dev.traakt.com/supabase",
//                     SUPABASE_PUBLIC_URL: "https://dev.traakt.com",
//                 },
//             },
//             kong: {
//                 enabled: true,
//                 environment: {
//                     SUPABASE_ANON_KEY: "",
//                     SUPABASE_SERVICE_KEY: "",
//                 },
//             },
//             auth: {
//                 enabled: true,
//                 environment: {
//                     GOTRUE_JWT_SECRET: "",
//                     GOTRUE_SITE_URL: "https://dev.traakt.com",
//                     GOTRUE_URI_ALLOW_LIST: "https://dev.traakt.com/*",
//                     GOTRUE_API_EXTERNAL_URL: "https://dev.traakt.com",
//                 },
//             },
//             rest: { enabled: true },
//             realtime: { enabled: true },
//             storage: {
//                 enabled: true,
//                 persistence: {
//                     enabled: true,
//                     size: "5Gi",
//                 },
//             },
//             meta: { enabled: true },
//         },
//     },
//     { dependsOn: supabaseNs },
// );
