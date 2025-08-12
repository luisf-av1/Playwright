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

  const res = await fetch('./data/test-results.json');
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
        const status = last?.status || test.status || '';
        if (status.toLowerCase() === 'passed') {
          features[featureName].passed++;
        } else if (status.toLowerCase() !== 'skipped') {
          features[featureName].failed++;
        }
      });
    });
  }

  (data.suites || []).forEach(s => traverse(s));

  const tbody = document.getElementById('featureRows');
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
