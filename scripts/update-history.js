// scripts/update-history.js
const fs = require("fs");
const path = require("path");

if (process.argv.length < 4) {
  console.error("Usage: node update-history.js <currentReportPath> <historyFilePath>");
  process.exit(1);
}

const currentReportPath = process.argv[2];
const historyFilePath = process.argv[3];
const historyDir = path.dirname(historyFilePath);

if (!fs.existsSync(currentReportPath)) {
  console.error(`❌ No test-results.json found at ${currentReportPath}`);
  process.exit(1);
}

const reportData = JSON.parse(fs.readFileSync(currentReportPath, "utf-8"));

// Calculate pass/fail counts
let passed = 0;
let failed = 0;
function traverse(node) {
  if (!node) return;
  if (Array.isArray(node.specs)) {
    node.specs.forEach(spec => {
      (spec.tests || []).forEach(test => {
        const results = Array.isArray(test.results) ? test.results : [];
        const last = results[results.length - 1];
        const status = (last?.status || test.status || "").toLowerCase();
        if (status === "passed") passed++;
        else if (status !== "skipped") failed++;
      });
    });
  }
  if (Array.isArray(node.suites)) {
    node.suites.forEach(traverse);
  }
}
(reportData.suites || []).forEach(traverse);

const totalCount = passed + failed;
const passRate = totalCount ? Number(((passed / totalCount) * 100).toFixed(1)) : 0;

// Make sure history folder exists
if (!fs.existsSync(historyDir)) {
  fs.mkdirSync(historyDir, { recursive: true });
}

// Load existing history
let history = [];
if (fs.existsSync(historyFilePath)) {
  history = JSON.parse(fs.readFileSync(historyFilePath, "utf-8"));
}

// Save current report file with date-based name
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const savedReportName = `${timestamp}.json`;
const savedReportPath = path.join(historyDir, savedReportName);
fs.copyFileSync(currentReportPath, savedReportPath);

// Append to history
history.push({
  date: new Date().toISOString(),
  passRate,
  passed,
  failed,
  duration: reportData.stats?.duration ? (reportData.stats.duration / 1000).toFixed(1) : null,
  fileName: savedReportName
});

// Save updated history.json
fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2));
console.log(`✅ History updated with ${savedReportName}`);
