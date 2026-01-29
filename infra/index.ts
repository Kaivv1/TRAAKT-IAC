import * as pulumi from "@pulumi/pulumi";
import * as backend from "./services/backend";
import * as certManager from "./core/cert-manager";

export const coreResources = {
    certManager: certManager.info,
};

export const services = {
    backend: backend.info,
};

export const urls = {
    backend: backend.urls,
};
