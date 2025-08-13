// ---------- helpers ----------
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
  return String(name || '').replace(/\.[^/.]+$/, '').replace(/\.spec$|\.test$/i, '');
}

function fmtDateTime(d) {
  if (!d) return '-';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '-';
  // show date + time with minutes (multiple runs per day)
  return dt.toLocaleString(undefined, {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
}

function badgeClassesByRate(rate) {
  // >=80 green, 50-79 yellow, <50 red
  if (rate >= 80) return 'bg-green-100 text-green-700';
  if (rate >= 50) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

// Traverse a Playwright JSON report and return stats for a given section.
function computeSectionFromReport(report, wantedSection) {
  if (!report || !report.suites) return null;

  const features = {};
  let passed = 0, failed = 0, skipped = 0;

  function traverse(node) {
    if (!node) return;
    if (Array.isArray(node.specs) && node.specs.length) {
      processSpecs(node.specs, node.file);
    }
    if (Array.isArray(node.suites) && node.suites.length) {
      node.suites.forEach(traverse);
    }
  }

  function processSpecs(specs, parentFile) {
    specs.forEach(spec => {
      const filePath = (spec.file || parentFile || '').replace(/\\/g, '/');
      if (!filePath) return;

      const parts = filePath.split('/').filter(Boolean);
      const e2i = parts.indexOf('e2e');
      const sectionPart = (e2i >= 0 && parts.length > e2i + 1) ? parts[e2i + 1] : parts[0];
      const sectionName = titleCase(sectionPart || 'Unknown');

      if (sectionName !== wantedSection) return;

      const filename = parts[parts.length - 1] || filePath;
      const featureName = titleCase(stripFileNameExt(filename));
      if (!features[featureName]) features[featureName] = { passed: 0, failed: 0, skipped: 0 };

      (spec.tests || []).forEach(test => {
        const results = Array.isArray(test.results) ? test.results : [];
        const last = results[results.length - 1];
        const status = (last?.status || test.status || '').toLowerCase();

        if (status === 'passed') {
          features[featureName].passed++; passed++;
        } else if (status === 'skipped') {
          features[featureName].skipped++; skipped++;
        } else {
          features[featureName].failed++; failed++;
        }
      });
    });
  }

  (report.suites || []).forEach(traverse);
  return { features, passed, failed, skipped };
}

// Pull per-section summary from a history entry (no per-feature here).
function computeSectionFromHistoryEntry(entry, sectionName) {
  const sec = entry?.bySection?.[sectionName];
  if (!sec) return null;
  const p = Number(sec.passed || 0);
  const f = Number(sec.failed || 0);
  const total = p + f;
  const rate = total ? (p / total) * 100 : 0;
  return { passed: p, failed: f, rate };
}

// ---------- main ----------
document.addEventListener('DOMContentLoaded', async () => {
  // Guard: run only on the section page
  const titleEl = document.getElementById('sectionTitle');
  const runInfoEl = document.getElementById('runInfo');
  const featureRowsEl = document.getElementById('featureRows');
  const historyListEl = document.getElementById('historyList');
  if (!titleEl || !runInfoEl || !featureRowsEl || !historyListEl) {
    // Not on section.html — do nothing
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const sectionName = params.get('name') || ''; // keep raw for lookup; display pretty
  const prettySection = sectionName || 'Section';
  titleEl.textContent = prettySection;

  if (!sectionName) {
    // No section specified: show a friendly note in-table, don't crash the page.
    featureRowsEl.innerHTML = `
      <tr><td colspan="4" class="p-4 text-gray-500">
        No section specified. Open this page via a dashboard card.
      </td></tr>`;
    historyListEl.innerHTML = `
      <li class="p-4 text-gray-500">No history to show.</li>`;
    return;
  }

  // Load current report first (to build the top "Run Details" table)
  let currentReport = null;
  try {
    const r = await fetch('./data/test-results.json', { cache: 'no-store' });
    if (r.ok) currentReport = await r.json();
  } catch (_) { /* ignore */ }

  // Load history for the list
  let history = [];
  try {
    const h = await fetch('./data/history.json', { cache: 'no-store' });
    if (h.ok) history = await h.json();
  } catch (_) { /* ignore */ }

  // ---- Run Details (latest execution table) ----
  // Prefer the live report for per-feature detail
  let sectionStats = null;
  let runDateText = '-';
  let runDurationText = '-';

  if (currentReport) {
    sectionStats = computeSectionFromReport(currentReport, titleCase(sectionName));
    runDateText = fmtDateTime(currentReport?.stats?.startTime);
    runDurationText = currentReport?.stats?.duration
      ? (currentReport.stats.duration / 1000).toFixed(1) + 's'
      : '-';
  } else if (history.length) {
    // Fallback: use most recent history entry that contains this section.
    const latest = [...history].reverse().find(h => h?.bySection?.[titleCase(sectionName)]);
    if (latest) {
      runDateText = fmtDateTime(latest.date);
      runDurationText = typeof latest.duration === 'number'
        ? latest.duration.toFixed(1) + 's'
        : (latest.duration || '-');
      // No per-feature info in history: render a single summary row
      const sec = computeSectionFromHistoryEntry(latest, titleCase(sectionName));
      sectionStats = { features: {}, passed: sec?.passed || 0, failed: sec?.failed || 0, skipped: 0 };
    }
  }

  // Render the table
  featureRowsEl.innerHTML = '';
  if (sectionStats && sectionStats.features && Object.keys(sectionStats.features).length) {
    Object.entries(sectionStats.features)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([fname, st]) => {
        const denom = (st.passed || 0) + (st.failed || 0);
        const rate = denom ? ((st.passed || 0) / denom) * 100 : 0;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="p-2">${fname}</td>
          <td class="p-2">${st.passed || 0}</td>
          <td class="p-2">${st.failed || 0}</td>
          <td class="p-2 font-medium">${rate.toFixed(1)}%</td>
        `;
        featureRowsEl.appendChild(tr);
      });
  } else if (sectionStats) {
    const denom = (sectionStats.passed || 0) + (sectionStats.failed || 0);
    const rate = denom ? (sectionStats.passed / denom) * 100 : 0;
    featureRowsEl.innerHTML = `
      <tr>
        <td class="p-2 text-gray-500">—</td>
        <td class="p-2">${sectionStats.passed}</td>
        <td class="p-2">${sectionStats.failed}</td>
        <td class="p-2 font-medium">${rate.toFixed(1)}%</td>
      </tr>`;
  } else {
    featureRowsEl.innerHTML = `
      <tr><td colspan="4" class="p-4 text-gray-500">
        No results for this section in the latest run.
      </td></tr>`;
  }

  runInfoEl.textContent = `${runDateText} • Duration: ${runDurationText}`;

  // ---- Execution History list (most recent first) ----
  historyListEl.innerHTML = '';
  if (Array.isArray(history) && history.length) {
    // newest first
    [...history].reverse().forEach(entry => {
      const sec = computeSectionFromHistoryEntry(entry, titleCase(sectionName));
      if (!sec) return; // skip runs that don't include this section

      const dateTxt = fmtDateTime(entry.date);
      const durTxt = typeof entry.duration === 'number'
        ? entry.duration.toFixed(1) + 's'
        : (entry.duration || '-');

      const pillRateClass = badgeClassesByRate(sec.rate);
      const li = document.createElement('li');
      li.className = 'p-4 hover:bg-gray-50 transition-colors';
      li.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="min-w-0">
            <div class="font-medium truncate">${dateTxt}</div>
            <div class="text-xs text-gray-500 mt-0.5">Duration: ${durTxt}</div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">P: ${sec.passed}</span>
            <span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">F: ${sec.failed}</span>
            <span class="px-2 py-1 text-xs rounded-full ${pillRateClass}">${sec.rate.toFixed(1)}%</span>
          </div>
        </div>`;
      historyListEl.appendChild(li);
    });

    if (!historyListEl.children.length) {
      historyListEl.innerHTML = `<li class="p-4 text-gray-500">No past runs for this section.</li>`;
    }
  } else {
    historyListEl.innerHTML = `<li class="p-4 text-gray-500">No history available yet.</li>`;
  }
});
