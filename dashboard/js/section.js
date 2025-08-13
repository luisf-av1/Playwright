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

async function parseReportForSection(reportUrl, sectionName) {
  const res = await fetch(reportUrl);
  const data = await res.json();
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
        const status = (last?.status || test.status || '').toLowerCase();
        if (status === 'passed') {
          features[featureName].passed++;
        } else if (status !== 'skipped') {
          features[featureName].failed++;
        }
      });
    });
  }

  (data.suites || []).forEach(s => traverse(s));

  return { features, date: data.stats?.startTime ? new Date(data.stats.startTime).toLocaleString() : '-' };
}

async function loadSection() {
  const params = new URLSearchParams(window.location.search);
  const sectionName = params.get('name');
  if (!sectionName) {
    document.body.innerHTML = "<p class='text-red-500'>No section specified.</p>";
    return;
  }
  document.getElementById('sectionTitle').textContent = sectionName;

  // Load last execution
  const lastExec = await parseReportForSection('./data/test-results.json', sectionName);
  document.getElementById('lastExecDate').textContent = lastExec.date;

  const tbody = document.getElementById('featureRows');
  Object.entries(lastExec.features).forEach(([fname, stats]) => {
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

  // Load history.json
  let history = [];
  try {
    const histRes = await fetch('./data/history.json');
    if (histRes.ok) history = await histRes.json();
  } catch (e) {
    console.warn('No history found');
  }

  // Build historical tables
  const histContainer = document.getElementById('historicalTables');
  for (const entry of history) {
    if (!entry.fileName) continue; // skip if no report file
    const runData = await parseReportForSection(`./data/${entry.fileName}`, sectionName);

    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'bg-white shadow rounded-lg p-4 mb-6';
    tableWrapper.innerHTML = `<h2 class="text-lg font-bold mb-4">Execution on ${runData.date}</h2>`;

    const table = document.createElement('table');
    table.className = 'w-full text-left border-collapse';
    table.innerHTML = `
      <thead>
        <tr class="bg-gray-100">
          <th class="p-2">Feature</th>
          <th class="p-2">Passed</th>
          <th class="p-2">Failed</th>
          <th class="p-2">Pass Rate</th>
        </tr>
      </thead>
    `;

    const tb = document.createElement('tbody');
    Object.entries(runData.features).forEach(([fname, stats]) => {
      const denom = stats.passed + stats.failed;
      const rate = denom ? (stats.passed / denom * 100) : 0;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="p-2">${fname}</td>
        <td class="p-2">${stats.passed}</td>
        <td class="p-2">${stats.failed}</td>
        <td class="p-2 font-medium">${rate.toFixed(1)}%</td>
      `;
      tb.appendChild(tr);
    });

    table.appendChild(tb);
    tableWrapper.appendChild(table);
    histContainer.appendChild(tableWrapper);
  }
}

loadSection();
