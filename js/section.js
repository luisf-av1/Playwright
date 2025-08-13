function titleCase(s) {
  return String(s || '')
    .replace(/[-_]+/g,' ')
    .replace(/\s+/g,' ')
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function stripFileNameExt(name) {
  return name.replace(/\.[^/.]+$/, '').replace(/\.spec$|\.test$/i, '');
}

async function loadSection() {
  const params = new URLSearchParams(window.location.search);
  const sectionName = params.get('name');
  if (!sectionName) {
    document.body.innerHTML = "<p class='text-red-500'>No section specified.</p>";
    return;
  }
  document.getElementById('sectionTitle').textContent = sectionName;

  // Load current report
  const res = await fetch('./data/test-results.json');
  const data = await res.json();
  renderFeaturesFromReport(data, sectionName, 'featureRows', 'Current Execution');

  // Load history
  let history = [];
  try {
    const h = await fetch('./data/history.json');
    if (h.ok) history = await h.json();
  } catch (e) {
    console.warn('No history.json found');
  }

  // Render each historical entry that has rawReport
  history.forEach(entry => {
    if (!entry.rawReport || !entry.rawReport.suites) {
      console.warn(`Skipping history entry for ${entry.date} — no rawReport`);
      return;
    }
    const tableId = `history-${entry.date}`;
    const container = document.createElement('div');
    container.className = 'bg-white shadow rounded-lg p-4 mt-6';
    container.innerHTML = `
      <h2 class="text-lg font-bold mb-4">
        Features — ${new Date(entry.date).toLocaleString()}
      </h2>
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-100">
            <th class="p-2">Feature</th>
            <th class="p-2">Passed</th>
            <th class="p-2">Failed</th>
            <th class="p-2">Pass Rate</th>
          </tr>
        </thead>
        <tbody id="${tableId}"></tbody>
      </table>
    `;
    document.body.appendChild(container);
    renderFeaturesFromReport(entry.rawReport, sectionName, tableId, entry.date);
  });
}

function renderFeaturesFromReport(report, sectionName, tableBodyId) {
  const features = {};
  function traverse(node) {
    if (!node) return;
    if (Array.isArray(node.specs)) {
      node.specs.forEach(spec => {
        const filePath = (spec.file || '').replace(/\\/g, '/');
        const parts = filePath.split('/').filter(Boolean);
        const e2i = parts.indexOf('e2e');
        const secPart = (e2i >= 0 && parts.length > e2i + 1) ? parts[e2i + 1] : '';
        if (titleCase(secPart) !== sectionName) return;

        const filename = parts[parts.length - 1];
        const featureName = titleCase(stripFileNameExt(filename));
        if (!features[featureName]) features[featureName] = { passed: 0, failed: 0 };

        (spec.tests || []).forEach(test => {
          const last = test.results?.[test.results.length - 1];
          const status = last?.status || test.status || '';
          if (status.toLowerCase() === 'passed') {
            features[featureName].passed++;
          } else if (status.toLowerCase() !== 'skipped') {
            features[featureName].failed++;
          }
        });
      });
    }
    if (Array.isArray(node.suites)) {
      node.suites.forEach(s => traverse(s));
    }
  }
  (report.suites || []).forEach(s => traverse(s));

  const tbody = document.getElementById(tableBodyId);
  Object.entries(features).forEach(([fname, stats]) => {
    const denom = stats.passed + stats.failed;
    const rate = denom ? (stats.passed / denom * 100) : 0;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-2">${fname}</td>
      <td class="p-2">${stats.passed}</td>
      <td class="p-2">${stats.failed}</td>
      <td class="p-2 font-medium">${rate.toFixed(1)}%</td>
    `;
    tbody.appendChild(tr);
  });
}

loadSection();
