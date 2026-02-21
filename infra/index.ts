import * as config from "./shared/config";
import { deployCertManager } from "./core-infra/cert-manager";
import { deployBackendService } from "./services/backend";
import { deployVault } from "./core-infra/vault";

const certManager = deployCertManager();
let vault: ReturnType<typeof deployVault> | null = null;

if (config.vault.enabled) {
    vault = deployVault([certManager.certChekCommand]);
}
const triggerCmd = vault ? vault.configureVaultCommand : certManager.certChekCommand;
for (const [env, conf] of Object.entries(config.serviceEnvironments)) {
    if (!conf.enabled) continue;
    deployBackendService(env, [triggerCmd]);
}
