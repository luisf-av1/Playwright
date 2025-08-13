const fs = require('fs');
const path = require('path');

const resultsFile = process.argv[2];
const historyFile = process.argv[3];

if (!fs.existsSync(resultsFile)) {
  console.error(`❌ No test-results.json found at ${resultsFile}`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));

// Count pass/fail
let passed = 0, failed = 0;
function traverse(node) {
  if (!node) return;
  if (Array.isArray(node.specs)) {
    node.specs.forEach(spec => {
      (spec.tests || []).forEach(test => {
        const last = test.results?.[test.results.length - 1];
        const status = last?.status || test.status || '';
        if (status.toLowerCase() === 'passed') {
          passed++;
        } else if (status.toLowerCase() !== 'skipped') {
          failed++;
        }
      });
    });
  }
  if (Array.isArray(node.suites)) {
    node.suites.forEach(s => traverse(s));
  }
}
(report.suites || []).forEach(s => traverse(s));

const total = passed + failed;
const passRate = total ? (passed / total) * 100 : 0;

// Read existing history
let history = [];
if (fs.existsSync(historyFile)) {
  history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
}

// Push new entry
history.push({
  date: report.stats?.startTime || new Date().toISOString(),
  passRate: Number(passRate.toFixed(1)),
  passed,
  failed,
  duration: report.stats?.duration ? (report.stats.duration / 1000).toFixed(1) : null,
  rawReport: report // store full report
});

// Keep last 50
if (history.length > 50) {
  history = history.slice(history.length - 50);
}

fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
console.log(`✅ History updated: ${history.length} entries`);
