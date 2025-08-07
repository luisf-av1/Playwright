const fs = require('fs');
const path = require('path');

const runId = process.argv[2];
if (!runId) {
  console.error('Usage: node aggregate-report.js <run_id>');
  process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync('playwright-report/report.json', 'utf-8'));

let totalPassed = 0;
let totalFailed = 0;

const sections = {};
const featureFailures = {};
const testFailures = {};

rawData.suites.forEach(suite => {
  suite.suites.forEach(subsuite => {
    const sectionName = path.basename(subsuite.title); // e.g., "Login", "Dashboard"
    if (!sections[sectionName]) {
      sections[sectionName] = { passed: 0, failed: 0, features: {} };
    }

    subsuite.specs.forEach(spec => {
      const testName = spec.title.join(' ');
      const outcome = spec.ok ? 'passed' : 'failed';

      if (outcome === 'passed') {
        sections[sectionName].passed++;
        totalPassed++;
      } else {
        sections[sectionName].failed++;
        totalFailed++;

        // Count failed test cases
        testFailures[testName] = (testFailures[testName] || 0) + 1;

        // Extract "feature" from title[0] if structured like ["feature", "scenario"]
        const feature = spec.title[0];
        featureFailures[feature] = (featureFailures[feature] || 0) + 1;
      }
    });
  });
});

const overallPassRate = Math.round((totalPassed / (totalPassed + totalFailed)) * 100);

// Sort helpers
const topSections = Object.entries(sections)
  .map(([name, s]) => ({
    name,
    passRate: Math.round((s.passed / (s.passed + s.failed)) * 100)
  }))
  .sort((a, b) => a.passRate - b.passRate)
  .slice(0, 3);

const topFeatures = Object.entries(featureFailures)
  .map(([name, count]) => ({ name, count }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 5);

const topFailedCases = Object.entries(testFailures)
  .map(([name, count]) => ({ name, count }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 10);

const result = {
  run_id: runId,
  timestamp: new Date().toISOString(),
  overall: {
    passed: totalPassed,
    failed: totalFailed,
    passRate: overallPassRate
  },
  sections,
  top_sections: topSections,
  top_features: topFeatures,
  top_failed_cases: topFailedCases
};

// Write result
fs.mkdirSync('pages/data/history', { recursive: true });
fs.writeFileSync(`pages/data/history/${runId}.json`, JSON.stringify(result, null, 2));
fs.writeFileSync('pages/data/history/latest.json', JSON.stringify(result, null, 2));

console.log(`✅ Report written to pages/data/history/${runId}.json`);
