import * as pulumi from "@pulumi/pulumi";
import type { DeploymentStack } from "./types";

const config = new pulumi.Config();
export const stack = pulumi.getStack() as DeploymentStack;

export const issuer = "letsencrypt-test";

export const labels = {
    backend: {
        dev: { app: "backend", environment: "dev" },
        demo: { app: "backend", environment: "demo" },
    },
};

export const vars = {
    createCoreResources: config.getBoolean("createCoreResources") || false,
    domains: config.getObject<string[]>("domains") || ["dev.traakt.com", "demo.traakt.com", "traakt.com"],
};
