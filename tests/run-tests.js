async function runTest(mod) {
  if (typeof mod === 'function') {
    await mod();
  } else if (mod && typeof mod.then === 'function') {
    await mod;
  }
}

(async () => {
  try {
    await runTest(require('./equation-tool.test.js'));
    await runTest(require('./mcp-post.test.js'));
    await runTest(require('./fetch-equation.test.js'));
    console.log('All tests passed');
  } catch (err) {
    console.error('Tests failed');
    console.error(err);
    process.exit(1);
  }
})();
