import * as pulumi from "@pulumi/pulumi";
import type { ConfigVars, Environment } from "./types";

const config = new pulumi.Config("infra");
export const issuer = "letsencrypt-test";

export const vars: ConfigVars = {
    environment: config.get("environment") as Environment,
    domains: config.getObject<string[]>("domains") || ["dev.traakt.com", "demo.traakt.com", "traakt.com"],
};

export const labels = {
    backend: { app: "backend", environment: vars.environment },
};
