import * as pulumi from "@pulumi/pulumi";
import type { DeploymentStack } from "./types";

const config = new pulumi.Config();
export const stack = pulumi.getStack() as DeploymentStack;

export const issuer = "letsencrypt-test";
export const domains = !["dev", "demo"].includes(stack) ? ["traakt.com", "www.traakt.com"] : [`${stack}.traakt.com`];

export const labels = {
    backend: { tier: "backend", environment: stack },
};
