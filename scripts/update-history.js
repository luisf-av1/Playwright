// update-history.js
const fs = require('fs');
const path = require('path');

const [,, reportPathArg, historyPathArg] = process.argv;
const reportPath = path.resolve(reportPathArg || 'dashboard/data/test-results.json');
const historyPath = path.resolve(historyPathArg || 'dashboard/data/history.json');

if (!fs.existsSync(reportPath)) {
  console.error('❌ No test-results.json found at', reportPath);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
let passed = 0, failed = 0;

function traverse(node) {
  if (!node) return;
  if (Array.isArray(node.specs)) {
    node.specs.forEach(spec => {
      (spec.tests || []).forEach(test => {
        const last = test.results?.[test.results.length - 1];
        const status = (last?.status || test.status || '').toLowerCase();
        if (status === 'passed') passed++;
        else if (status && status !== 'skipped') failed++;
      });
    });
  }
  if (Array.isArray(node.suites)) {
    node.suites.forEach(traverse);
  }
}

(data.suites || []).forEach(traverse);

const total = passed + failed;
const passRate = total ? (passed / total) * 100 : 0;

let history = [];
if (fs.existsSync(historyPath)) {
  history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
}

history.push({
  date: new Date().toISOString(),
  passed,
  failed,
  passRate: Number(passRate.toFixed(1)),
  duration: data.stats?.duration ? Number((data.stats.duration / 1000).toFixed(1)) : null
});

fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
console.log('✅ Updated history.json');
