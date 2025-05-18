const http = require('http');
const assert = require('assert');

module.exports = () => new Promise((resolve, reject) => {
  const expectedReq = {
    type: 'ExecuteTool',
    tool: 'generate-latex-equation',
    parameters: {
      description: 'test equation',
      format: 'display',
      numbered: false
    }
  };

  const expectedRes = { result: { latex: 'x=1' } };

  const server = http.createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/mcp') {
      res.statusCode = 404;
      return res.end();
    }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        assert.deepStrictEqual(parsed, expectedReq);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(expectedRes));
      } catch (err) {
        reject(err);
        server.close();
      }
    });
  });

  server.listen(0, async () => {
    const { port } = server.address();
    try {
      const resp = await fetch(`http://localhost:${port}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expectedReq)
      });
      const json = await resp.json();
      assert.deepStrictEqual(json, expectedRes);
      console.log('mcp-post test passed');
      resolve();
    } catch (err) {
      reject(err);
    } finally {
      server.close();
    }
  });
});
