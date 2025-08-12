const fs = require("fs");
const path = require("path");

if (process.argv.length < 4) {
  console.error("Usage: node update-history.js <latest-report.json> <history.json>");
  process.exit(1);
}

const latestPath = process.argv[2];
const historyPath = process.argv[3];

if (!fs.existsSync(latestPath)) {
  console.error(`Latest report not found: ${latestPath}`);
  process.exit(1);
}

const latest = JSON.parse(fs.readFileSync(latestPath, "utf-8"));

let totalPassed = 0;
let totalFailed = 0;
(latest.suites || []).forEach(suite => {
  (suite.specs || []).forEach(spec => {
    (spec.tests || []).forEach(test => {
      const results = test.results || [];
      const last = results[results.length - 1];
      if (!last) return;
      if (last.status === "passed") totalPassed++;
      else if (last.status !== "skipped") totalFailed++;
    });
  });
});

const passRate = totalPassed + totalFailed > 0
  ? (totalPassed / (totalPassed + totalFailed)) * 100
  : 0;

const summaryEntry = {
  date: latest.stats?.startTime
    ? new Date(latest.stats.startTime).toISOString()
    : new Date().toISOString(),
  passRate: Number(passRate.toFixed(1)),
  passed: totalPassed,
  failed: totalFailed,
  duration: latest.stats?.duration
    ? Number((latest.stats.duration / 1000).toFixed(1))
    : null
};

// Load existing history
let history = [];
if (fs.existsSync(historyPath)) {
  try {
    history = JSON.parse(fs.readFileSync(historyPath, "utf-8"));
    if (!Array.isArray(history)) history = [];
  } catch {
    history = [];
  }
}

// Avoid duplicate entry for same date
if (!history.find(h => h.date === summaryEntry.date)) {
  history.push(summaryEntry);
}

// Sort by date
history.sort((a, b) => new Date(a.date) - new Date(b.date));

// Save
fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
console.log(`History updated with ${summaryEntry.date}`);
