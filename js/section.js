function titleCase(s) {
  return String(s || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function stripFileNameExt(name) {
  return name.replace(/\.[^/.]+$/, '').replace(/\.spec$|\.test$/i, '');
}

function getSectionStatsFromRun(run, sectionName) {
  let totalPassed = 0, totalFailed = 0;

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
      const filePath = (spec.file || parentFile || '').replace(/\\/g, '/');
      const parts = filePath.split('/').filter(Boolean);
      const e2i = parts.indexOf('e2e');
      const secPart = (e2i >= 0 && parts.length > e2i + 1) ? parts[e2i + 1] : '';
      const secName = titleCase(secPart);
      if (secName !== sectionName) return;

      (spec.tests || []).forEach(test => {
        const last = test.results?.[test.results.length - 1];
        const status = last?.status || test.status || '';
        if (status.toLowerCase() === 'passed') {
          totalPassed++;
        } else if (status.toLowerCase() !== 'skipped') {
          totalFailed++;
        }
      });
    });
  }

  traverse(run.rawReport);
  const totalCount = totalPassed + totalFailed;
  return {
    passed: totalPassed,
    failed: totalFailed,
    passRate: totalCount ? (totalPassed / totalCount * 100).toFixed(1) : 0
  };
}

async function loadSection() {
  const params = new URLSearchParams(window.location.search);
  const sectionName = params.get('name');
  if (!sectionName) {
    document.body.innerHTML = "<p class='text-red-500'>No section specified.</p>";
    return;
  }
  document.getElementById('sectionTitle').textContent = sectionName;

  // Load history.json
  let historyData = [];
  try {
    const h = await fetch('./data/history.json');
    if (h.ok) {
      historyData = await h.json();
    }
  } catch (e) {
    console.warn('No history.json found');
  }

  // Sort newest first
  historyData.sort((a, b) => new Date(b.date) - new Date(a.date));

  const historyListEl = document.getElementById('historyList');
  const tbody = document.getElementById('featureRows');
  tbody.innerHTML = '';

  historyData.forEach((run, idx) => {
    const { passed, failed, passRate } = getSectionStatsFromRun(run, sectionName);

    const li = document.createElement('li');
    li.className = 'p-2 border-b cursor-pointer hover:bg-gray-100';
    li.innerHTML = `
      <div class="flex justify-between">
        <span>${new Date(run.date).toLocaleString()} (${run.duration || '-'}s)</span>
        <div class="flex items-center gap-2 shrink-0">
            <span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">P: ${passed}</span>
            <span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">F: ${failed}</span>
            <span class="px-2 py-1 text-xs rounded-full">R: ${passRate.toFixed(1)}%</span>
        </div>
      </div>
    `;
    li.addEventListener('click', () => {
      renderFeaturesFromReport(run.rawReport, sectionName, run.date, run.duration);
    });

    // Default: show latest run
    if (idx === 0) {
      renderFeaturesFromReport(run.rawReport, sectionName, run.date, run.duration);
    }

    historyListEl.appendChild(li);
  });
}

function renderFeaturesFromReport(report, sectionName, date, duration) {
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
      const filePath = (spec.file || parentFile || '').replace(/\\/g, '/');
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

  traverse(report);

  // Update table title
  document.querySelector('#featureTable h2').innerText =
    `Features — ${new Date(date).toLocaleString()} (${duration || '-'}s)`;

  const tbody = document.getElementById('featureRows');
  tbody.innerHTML = '';
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