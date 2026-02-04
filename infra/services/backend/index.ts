import {
    backendCorsMiddleware,
    backendHttpsRedirectMiddleware,
    backendIngress,
    backendRateLimitMiddleware,
} from "./ingress";
import { backendDeployment } from "./deployment";
import { backendNs } from "./namespace";
import { backendService } from "./service";

const info = {
    namespace: backendNs.metadata.name,
    svc: backendService.metadata.name,
    deployment: backendDeployment.metadata.name,
    ingress: backendIngress.metadata.name,
    middlewares: {
        cors: backendCorsMiddleware.name,
        httpsRedirect: backendHttpsRedirectMiddleware.name,
        rateLimit: backendRateLimitMiddleware.name,
    },
};

const urls = backendIngress.spec.rules.apply((rules) => rules.map((rule) => `https://${rule.host}/api`));

export { info, urls };
