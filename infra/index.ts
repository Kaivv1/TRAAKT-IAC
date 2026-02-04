import * as backend from "./services/backend";
import * as certManager from "./core/cert-manager";
import * as config from "./shared/config";

export const coreResources = {
    certManager: certManager.info,
};

export const services = {
    [config.vars.environment]: {
        backend: backend.info,
    },
};

export const urls = {
    [config.vars.environment]: {
        backend: backend.urls,
    },
};
