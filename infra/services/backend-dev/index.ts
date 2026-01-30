import {
    backendCorsMiddlewareDev,
    backendHttpsRedirectMiddlewareDev,
    backendIngressDev,
    backendRateLimitMiddlewareDev,
} from "./ingress";
import { backendDeploymentDev } from "./deployment";
import { backendNsDev } from "./namespace";
import { backendServiceDev } from "./service";

const info = {
    namespace: backendNsDev.metadata.name,
    svc: backendServiceDev.metadata.name,
    deployment: backendDeploymentDev.metadata.name,
    ingress: backendIngressDev.metadata.name,
    middlewares: {
        cors: backendCorsMiddlewareDev.name,
        httpsRedirect: backendHttpsRedirectMiddlewareDev.name,
        rateLimit: backendRateLimitMiddlewareDev.name,
    },
};

const urls = backendIngressDev.spec.rules.apply((rules) => rules.map((rule) => `https://${rule.host}/api`));

export { info, urls };
