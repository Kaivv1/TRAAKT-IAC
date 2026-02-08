import * as pulumi from "@pulumi/pulumi";
import { createBackendDeployment } from "./deployment";
import { createBackendIngress } from "./ingress";
import { createBackendNs } from "./namespace";
import { createBackendSvc } from "./service";

export const deployBackendService = (env: string, dependsOn: pulumi.Resource[]) => {
    const backendNs = createBackendNs(env);
    const backendSvc = createBackendSvc(backendNs.metadata.name, env, [backendNs]);
    const backendDeployment = createBackendDeployment(backendNs.metadata.name, env, [backendNs]);
    const backendIngress = createBackendIngress(backendNs.metadata.name, backendSvc.metadata.name, env, [
        backendNs,
        ...dependsOn,
    ]);

    return { backendNs, backendSvc, backendDeployment, backendIngress };
};
