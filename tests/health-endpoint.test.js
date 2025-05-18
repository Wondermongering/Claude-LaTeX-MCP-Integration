const fs = require('fs');
const assert = require('assert');

const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '../src/core/server.ts'), 'utf8');
assert.ok(/app\.get\(['"]\/health['"]/.test(content), '/health endpoint missing');
console.log('health-endpoint test passed');
