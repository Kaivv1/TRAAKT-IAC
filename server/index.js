const http = require('node:http');
const fs = require('node:fs');

function getSecrets() {
    try {
        const data = fs.readFileSync('/vault/secrets/backend.json', 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.log('⚠️  No Vault secrets');
        return {};
    }
}
let secrets = getSecrets();

fs.watchFile('/vault/secrets/backend.json', () => {
    console.log('Secrets file changed, reloading...');
    secrets = getSecrets();
});

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
        JSON.stringify({
            message: 'Hello World',
            secrets: secrets,
        }),
    );
});

server.listen(8080, () => {
    console.log('Server running on http://localhost:8080');
    console.log('Loaded secrets:', secrets);
});
