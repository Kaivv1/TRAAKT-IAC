import * as k8s from "@pulumi/kubernetes";
import * as config from "../../shared/config";
import { certificate } from "../../core/cert-manager";

export const backendNs = new k8s.core.v1.Namespace(
    `backend-service-${config.vars.environment}`,
    {
        metadata: { name: `backend-service-${config.vars.environment}`, labels: config.labels.backend },
    },
    { protect: true, dependsOn: certificate },
);
