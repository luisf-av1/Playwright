const fs = require("fs");
const path = require("path");

const newReportPath = path.join(__dirname, "../playwright-report/test-results.json");
const historyPath = path.join(__dirname, "../dashboard/history.json");

function summarizeReport(report) {
  let passed = 0, failed = 0, skipped = 0;
  const sections = {};

  function processSuite(suite) {
    if (suite.specs) {
      suite.specs.forEach(spec => {
        spec.tests.forEach(test => {
          const status = test.status || test.expectedStatus;
          if (status === "passed" || status === "expected") passed++;
          else if (status === "failed" || status === "unexpected") failed++;
          else if (status === "skipped") skipped++;

          const sectionName = suite.title.split("\\")[1] || suite.title;
          if (!sections[sectionName]) {
            sections[sectionName] = { passed: 0, failed: 0 };
          }
          if (status === "passed" || status === "expected") sections[sectionName].passed++;
          if (status === "failed" || status === "unexpected") sections[sectionName].failed++;
        });
      });
    }
    if (suite.suites) suite.suites.forEach(processSuite);
  }

  report.suites.forEach(processSuite);

  const total = passed + failed;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  return {
    date: new Date(report.stats.startTime).toISOString(),
    stats: { passed, failed, skipped, passRate },
    sections
  };
}

// Read new report
const newReport = JSON.parse(fs.readFileSync(newReportPath, "utf8"));
const summary = summarizeReport(newReport);

// Read existing history (if any)
let history = [];
if (fs.existsSync(historyPath)) {
  history = JSON.parse(fs.readFileSync(historyPath, "utf8"));
}

// Append new summary and save
history.push(summary);
fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

console.log("✅ History updated with new execution:", summary.date);
