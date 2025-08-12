const fs = require('fs');

const [ , , latestPath, historyPath ] = process.argv;

if (!latestPath || !historyPath) {
  console.error('Usage: node update-history.js <latestReport> <historyFile>');
  process.exit(1);
}

const latestReport = JSON.parse(fs.readFileSync(latestPath, 'utf8'));

// Calculate pass/fail
let passed = 0, failed = 0;
(latestReport.suites || []).forEach(suite => {
  (suite.specs || []).forEach(spec => {
    (spec.tests || []).forEach(test => {
      const results = test.results || [];
      const status = results[results.length - 1]?.status?.toLowerCase() || '';
      if (status === 'passed') passed++;
      else if (status !== 'skipped') failed++;
    });
  });
});

const total = passed + failed;
const passRate = total ? ((passed / total) * 100).toFixed(1) : 0;
const summaryEntry = {
  date: latestReport.stats?.startTime || new Date().toISOString(),
  passed,
  failed,
  passRate: Number(passRate)
};

// Read existing history
let history = [];
if (fs.existsSync(historyPath)) {
  history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
  if (!Array.isArray(history)) history = [];
}

history.push(summaryEntry);
fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
console.log('Updated history.json with:', summaryEntry);
