import { runCommandEngineTests } from './commandEngine.test';

async function main() {
  console.log('Running AI Command Engine Unit Tests...\n');
  const res = await runCommandEngineTests();
  console.log('--- TEST RESULTS ---');
  res.log.forEach((l: string) => console.log(l));
  console.log(`\nSummary: Total: ${res.total} | Passed: ${res.total - res.failed} | Failed: ${res.failed}`);
  if (!res.passed) {
    process.exit(1);
  }
}

main();
