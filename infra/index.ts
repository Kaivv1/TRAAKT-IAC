import * as backendDev from "./services/backend-dev";
import * as backendDemo from "./services/backend-demo";
import * as certManager from "./core/cert-manager";

export const coreResources = {
    certManager: certManager.info,
};

export const services = {
    dev: {
        backend: backendDev.info,
    },
    demo: {
        backend: backendDemo.info,
    },
};

export const urls = {
    dev: {
        backend: backendDev.urls,
    },
    demo: {
        backend: backendDemo.urls,
    },
};
