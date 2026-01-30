import * as pulumi from "@pulumi/pulumi";

export const pulumiOutputToStr = (output: pulumi.Output<string>) => pulumi.interpolate`${output}`;
