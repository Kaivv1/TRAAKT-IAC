import * as k8s from "@pulumi/kubernetes";
import * as config from "../../shared/config";

export const backendNsDemo = new k8s.core.v1.Namespace("backend-service-demo", {
    metadata: { name: "backend-service-demo", labels: config.labels.backend.demo },
});
