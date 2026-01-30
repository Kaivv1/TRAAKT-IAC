const http = require('node:http');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Hello World' }));
});

server.listen(8080, () => {
    console.log('Server running on http://localhost:8080');
});
