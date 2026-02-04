export type Environment = "dev" | "demo";

export interface ConfigVars {
    environment: Environment;
    domains: string[];
}
