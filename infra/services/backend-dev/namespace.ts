import * as k8s from "@pulumi/kubernetes";
import * as config from "../../shared/config";

export const backendNsDev = new k8s.core.v1.Namespace("backend-service-dev", {
    metadata: { name: "backend-service-dev", labels: config.labels.backend.dev },
});
