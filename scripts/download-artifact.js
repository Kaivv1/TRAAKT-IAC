const { Octokit } = require('@octokit/rest');
const { execSync } = require('child_process');
const fs = require('fs');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
const envName = process.env.ENVIRONMENT;

const main = async () => {
    const { data } = await octokit.rest.actions.listArtifactsForRepo({
        owner,
        repo,
        per_page: 100,
    });

    const matchingArtifacts = data.artifacts
        .filter((a) => a.name === `pulumi-state-${envName}`)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (matchingArtifacts.length === 0) {
        console.log(`No artifact found for ${envName}`);
        process.exit(0);
    }

    const artifact = matchingArtifacts[0];
    console.log(`Found: ${artifact.name}`);

    const download = await octokit.rest.actions.downloadArtifact({
        owner,
        repo,
        artifact_id: artifact.id,
        archive_format: 'zip',
    });

    execSync('mkdir -p /home/runner/.pulumi/stacks');
    fs.writeFileSync('/tmp/artifact.zip', Buffer.from(download.data));
    execSync('unzip -o /tmp/artifact.zip -d /home/runner/.pulumi/stacks');

    console.log('Done');
};

main().catch(console.error);
