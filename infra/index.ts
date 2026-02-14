import * as config from "./shared/config";
import { deployCertManager } from "./core-infra/cert-manager";
import { deployBackendService } from "./services/backend";
import { deployVault } from "./core-infra/vault";

const { certChekCommand } = deployCertManager();
const { unsealVaultsCommand } = deployVault([certChekCommand]);

for (const [env, conf] of Object.entries(config.serviceEnvironemnts)) {
    if (!conf.enabled) continue;
    deployBackendService(env, [unsealVaultsCommand]);
}
