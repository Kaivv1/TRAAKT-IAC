import {
    backendCorsMiddlewareDemo,
    backendHttpsRedirectMiddlewareDemo,
    backendIngressDemo,
    backendRateLimitMiddlewareDemo,
} from "./ingress";
import { backendDeploymentDemo } from "./deployment";
import { backendNsDemo } from "./namespace";
import { backendServiceDemo } from "./service";

const info = {
    namespace: backendNsDemo.metadata.name,
    svc: backendServiceDemo.metadata.name,
    deployment: backendDeploymentDemo.metadata.name,
    ingress: backendIngressDemo.metadata.name,
    middlewares: {
        cors: backendCorsMiddlewareDemo.name,
        httpsRedirect: backendHttpsRedirectMiddlewareDemo.name,
        rateLimit: backendRateLimitMiddlewareDemo.name,
    },
};

const urls = backendIngressDemo.spec.rules.apply((rules) => rules.map((rule) => `https://${rule.host}/api`));

export { info, urls };
