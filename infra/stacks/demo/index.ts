import {
    backendCorsMiddleware,
    backendHttpsRedirectMiddleware,
    backendIngress,
    backendRateLimitMiddleware,
} from "./backend/ingress";
import { backendDeployment } from "./backend/deployment";
import { backendNs } from "./backend/namespace";
import { backendService } from "./backend/service";

export const deployed = {
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

export const urls = backendIngress.spec.rules.apply((rules) => rules.map((rule) => `https://${rule.host}/api`));
