import * as k8s from "@pulumi/kubernetes";
import * as config from "../../shared/config";

export const backendNs = new k8s.core.v1.Namespace(`backend-service-${config.stack}`, {
    metadata: { name: `backend-service-${config.stack}`, labels: config.labels.backend },
});
