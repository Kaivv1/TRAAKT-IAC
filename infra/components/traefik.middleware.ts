import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

export interface TraefikMiddlewareArgs {
    name: string;
    namespace: pulumi.Input<string>;
    spec: Object;
    labels: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
    provider?: k8s.Provider;
}

export class TraefikMiddleware extends pulumi.ComponentResource {
    public readonly middleware: k8s.apiextensions.CustomResource;
    public readonly name: pulumi.Output<string>;
    public readonly namespace: pulumi.Output<string>;

    constructor(name: string, args: TraefikMiddlewareArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:traefik:Middleware", name, {}, opts);

        this.middleware = new k8s.apiextensions.CustomResource(
            args.name,
            {
                apiVersion: "traefik.io/v1alpha1",
                kind: "Middleware",
                metadata: {
                    name: args.name,
                    namespace: args.namespace,
                    labels: args.labels,
                },
                spec: args.spec,
            },
            { parent: this, provider: args.provider },
        );

        this.name = this.middleware.metadata.name;
        this.namespace = this.middleware.metadata.namespace;

        this.registerOutputs({
            middleware: this.middleware,
            name: this.name,
            namespace: this.namespace,
        });
    }

    public static createHttpsRedirect(
        name: string,
        namespace: pulumi.Input<string>,
        labels: pulumi.Input<{ [key: string]: pulumi.Input<string> }>,
        opts?: pulumi.ComponentResourceOptions,
        provider?: k8s.Provider,
    ): TraefikMiddleware {
        return new TraefikMiddleware(
            name,
            {
                name,
                namespace,
                labels,
                spec: {
                    redirectScheme: {
                        scheme: "https",
                        permanent: true,
                    },
                },
                provider: provider,
            },
            opts,
        );
    }

    public static createRateLimit(
        name: string,
        namespace: pulumi.Input<string>,
        labels: pulumi.Input<{ [key: string]: pulumi.Input<string> }>,
        opts?: pulumi.ComponentResourceOptions,
        average: number = 20,
        burst: number = 40,
        provider?: k8s.Provider,
    ): TraefikMiddleware {
        return new TraefikMiddleware(
            name,
            {
                name,
                namespace,
                labels,
                spec: {
                    rateLimit: {
                        average: average,
                        burst: burst,
                    },
                },
                provider: provider,
            },
            opts,
        );
    }

    public static createCors(
        name: string,
        namespace: pulumi.Input<string>,
        labels: pulumi.Input<{ [key: string]: pulumi.Input<string> }>,
        allowedOrigins: string[],
        opts?: pulumi.ComponentResourceOptions,
        methods: string[] = ["GET", "POST", "PUT", "PATCH", "DELETE"],
        provider?: k8s.Provider,
    ): TraefikMiddleware {
        return new TraefikMiddleware(
            name,
            {
                name,
                namespace,
                labels,
                spec: {
                    headers: {
                        accessControlAllowOriginList: allowedOrigins,
                        accessControlAllowMethods: methods,
                        accessControlAllowHeaders: ["*"],
                        accessControlAllowCredentials: true,
                        accessControlMaxAge: 3600,
                        addVaryHeader: true,
                    },
                },
                provider: provider,
            },
            opts,
        );
    }

    public static createPrefixStripper(
        name: string,
        namespace: pulumi.Input<string>,
        labels: pulumi.Input<{ [key: string]: pulumi.Input<string> }>,
        prefixes: string[],
        provider?: k8s.Provider,
        opts?: pulumi.ComponentResourceOptions,
    ): TraefikMiddleware {
        return new TraefikMiddleware(
            name,
            {
                name,
                namespace,
                labels,
                spec: {
                    stripPrefix: {
                        prefixes,
                    },
                },
                provider: provider,
            },
            opts,
        );
    }
}
