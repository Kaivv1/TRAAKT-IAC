export {};

declare global {
    type Environment = "dev" | "demo";

    interface ConfigVars {
        environment: Environment;
        domains: string[];
    }
}
