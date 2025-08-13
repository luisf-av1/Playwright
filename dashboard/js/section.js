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

  // Load latest test-results.json
  let latestData;
  try {
    const res = await fetch('./data/test-results.json');
    latestData = await res.json();
  } catch {
    document.body.innerHTML = "<p class='text-red-500'>Failed to load latest results.</p>";
    return;
  }

  // Render latest features
  renderFeaturesFromReport(latestData, sectionName, document.getElementById('featureRows'));

  // Load history.json for historical tables
  let historyData = [];
  try {
    const res = await fetch('./data/history.json');
    if (res.ok) historyData = await res.json();
  } catch(e) {
    console.warn('No history.json found.');
  }

  // Filter for historical runs (excluding latest one)
  const historyContainer = document.getElementById('historyContainer');
  historyContainer.innerHTML = '';
  historyData
    .slice(0, -1) // remove last entry (latest run)
    .reverse() // oldest first when toggled
    .forEach(run => {
      const sectionTable = document.createElement('div');
      sectionTable.className = "bg-white shadow rounded-lg p-4";
      sectionTable.innerHTML = `
        <h2 class="text-xl font-bold mb-4">Features - ${new Date(run.date).toLocaleString()}</h2>
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-100">
              <th class="p-2">Feature</th>
              <th class="p-2">Passed</th>
              <th class="p-2">Failed</th>
              <th class="p-2">Pass Rate</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      `;
      const tbody = sectionTable.querySelector('tbody');
      renderFeaturesFromReport(run.rawReport, sectionName, tbody);
      historyContainer.appendChild(sectionTable);
    });

  // Toggle button
  document.getElementById('toggleHistory').addEventListener('click', () => {
    historyContainer.classList.toggle('hidden');
    const btn = document.getElementById('toggleHistory');
    btn.textContent = historyContainer.classList.contains('hidden')
      ? 'Show Historical Data'
      : 'Hide Historical Data';
  });
}

function renderFeaturesFromReport(reportData, sectionName, tbodyEl) {
  const features = {};
  function traverse(node) {
    if (!node) return;
    if (Array.isArray(node.specs) && node.specs.length) {
      processSpecs(node.specs, node.file);
    }
    if (Array.isArray(node.suites) && node.suites.length) {
      node.suites.forEach(s => traverse(s));
    }
  }
  function processSpecs(specs, parentFile) {
    specs.forEach(spec => {
      const filePath = (spec.file || parentFile || '').replace(/\\/g,'/');
      const parts = filePath.split('/').filter(Boolean);
      const e2i = parts.indexOf('e2e');
      const secPart = (e2i >= 0 && parts.length > e2i + 1) ? parts[e2i + 1] : '';
      const secName = titleCase(secPart);
      if (secName !== sectionName) return;

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
  (reportData.suites || []).forEach(s => traverse(s));

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
    tbodyEl.appendChild(tr);
  });
}

loadSection();
