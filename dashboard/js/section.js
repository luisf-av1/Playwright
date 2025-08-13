/* ========== Utilities ========== */
function titleCase(s) {
  return String(s || "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function stripFileNameExt(name) {
  return name.replace(/\.[^/.]+$/, "").replace(/\.spec$|\.test$/i, "");
}

// folder name used under /history for a given ISO date
function slugFromDate(dateStr) {
  // expect dateStr to be ISO-ish; normalize with Date first
  const iso = new Date(dateStr).toISOString();
  return iso.replace(/[:.]/g, "-"); // 2025-08-11T22-33-44-123Z
}

// color helper for pass rate
function rateBadgeClass(rate) {
  if (rate < 50) return "bg-red-100 text-red-700";
  if (rate < 80) return "bg-yellow-100 text-yellow-700";
  return "bg-green-100 text-green-700";
}

/* ========== Core parsing ========== */
function computeSectionFromReport(report, sectionName) {
  const features = {}; // { feature: {passed, failed} }
  let totalPassed = 0;
  let totalFailed = 0;

  function traverse(node) {
    if (!node) return;
    if (Array.isArray(node.specs) && node.specs.length) {
      processSpecs(node.specs, node.file);
    }
    if (Array.isArray(node.suites) && node.suites.length) {
      node.suites.forEach((s) => traverse(s));
    }
  }

  function processSpecs(specs, parentFile) {
    specs.forEach((spec) => {
      const filePath = (spec.file || parentFile || "").replace(/\\/g, "/");
      const parts = filePath.split("/").filter(Boolean);
      const e2i = parts.indexOf("e2e");
      const secPart =
        e2i >= 0 && parts.length > e2i + 1 ? parts[e2i + 1] : parts[0] || "";
      const secName = titleCase(secPart);
      if (secName !== sectionName) return;

      const filename = parts[parts.length - 1] || filePath;
      const featureName = titleCase(stripFileNameExt(filename));
      if (!features[featureName]) features[featureName] = { passed: 0, failed: 0 };

      (spec.tests || []).forEach((test) => {
        const results = Array.isArray(test.results) ? test.results : [];
        const last = results[results.length - 1];
        const status = String(last?.status || test.status || "").toLowerCase();

        if (status === "passed") {
          features[featureName].passed++;
          totalPassed++;
        } else if (status === "skipped") {
          // ignore skipped for pass-rate
        } else {
          features[featureName].failed++;
          totalFailed++;
        }
      });
    });
  }

  (report?.suites || []).forEach((s) => traverse(s));

  const denom = totalPassed + totalFailed;
  const passRate = denom ? (totalPassed / denom) * 100 : 0;
  return { features, totalPassed, totalFailed, passRate };
}

/* ========== Rendering ========== */
function renderFeaturesTable({ features }, dateStr, durationSec) {
  const tbody = document.getElementById("featureRows");
  tbody.innerHTML = "";

  // header meta
  document.getElementById("tableTitle").textContent = "Run Details";
  const meta = [];
  if (dateStr) meta.push(new Date(dateStr).toLocaleString());
  if (durationSec != null) meta.push(`Duration: ${Number(durationSec).toFixed(1)}s`);
  document.getElementById("tableMeta").textContent = meta.join(" • ");

  // sort features: failures desc, then name
  const rows = Object.entries(features).sort(
    ([aName, a], [bName, b]) => b.failed - a.failed || aName.localeCompare(bName)
  );

  rows.forEach(([fname, stats]) => {
    const denom = stats.passed + stats.failed;
    const rate = denom ? (stats.passed / denom) * 100 : 0;
    const tr = document.createElement("tr");
    tr.className = "border-b";
    tr.innerHTML = `
      <td class="p-2">${fname}</td>
      <td class="p-2">${stats.passed}</td>
      <td class="p-2">${stats.failed}</td>
      <td class="p-2 font-medium">${rate.toFixed(1)}%</td>
    `;
    tbody.appendChild(tr);
  });

  if (!rows.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4" class="p-3 text-sm text-gray-500">No tests found for this section in this run.</td>`;
    tbody.appendChild(tr);
  }
}

function renderHistoryItem(container, run, sectionName, getReportFn) {
  const li = document.createElement("li");
  li.className =
    "flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-gray-50 cursor-pointer";

  const dateTxt = new Date(run.date).toLocaleString();

  // base layout (numbers will be filled after we compute section-specific stats)
  li.innerHTML = `
    <div class="min-w-0">
      <div class="font-medium truncate">${dateTxt}</div>
      <div class="text-xs text-gray-500">Duration: ${run.duration != null ? Number(run.duration).toFixed(1) : "-"}s</div>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      <span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700" data-badge="passed">P: …</span>
      <span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700" data-badge="failed">F: …</span>
      <span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700" data-badge="rate">…%</span>
      <svg class="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
      </svg>
    </div>
  `;

  // compute section-specific stats asynchronously, then update badges
  getReportFn()
    .then((report) => {
      const stats = computeSectionFromReport(report, sectionName);
      const rate = (stats.totalPassed + stats.totalFailed)
        ? (stats.totalPassed / (stats.totalPassed + stats.totalFailed)) * 100
        : 0;

      const passedEl = li.querySelector('[data-badge="passed"]');
      const failedEl = li.querySelector('[data-badge="failed"]');
      const rateEl   = li.querySelector('[data-badge="rate"]');

      passedEl.textContent = `P: ${stats.totalPassed}`;
      failedEl.textContent = `F: ${stats.totalFailed}`;

      // color badges
      passedEl.className = "px-2 py-1 text-xs rounded-full bg-green-100 text-green-700";
      failedEl.className = "px-2 py-1 text-xs rounded-full bg-red-100 text-red-700";
      rateEl.className   = `px-2 py-1 text-xs rounded-full ${rateBadgeClass(rate)}`;
      rateEl.textContent = `${rate.toFixed(1)}%`;

      // click loads table with this run
      li.addEventListener("click", () => {
        renderFeaturesTable(stats, run.date, run.duration);
      });
    })
    .catch(() => {
      // still allow click, it will try again to fetch and render
      li.addEventListener("click", async () => {
        try {
          const report = await getReportFn();
          const stats = computeSectionFromReport(report, sectionName);
          renderFeaturesTable(stats, run.date, run.duration);
        } catch (e) {
          alert("Could not load this run’s details.");
        }
      });
    });

  container.appendChild(li);
}

/* ========== Page bootstrap ========== */
async function loadSection() {
  const params = new URLSearchParams(window.location.search);
  const sectionName = params.get("name");
  if (!sectionName) {
    document.body.innerHTML = "<p class='text-red-500'>No section specified.</p>";
    return;
  }
  document.getElementById("sectionTitle").textContent = sectionName;

  // 1) load history (ordered newest→oldest)
  let history = [];
  try {
    const h = await fetch("./data/history.json");
    if (h.ok) history = await h.json();
  } catch {}
  history.sort((a, b) => new Date(b.date) - new Date(a.date));

  // 2) render history list (badges are section-specific)
  const historyList = document.getElementById("historyList");
  historyList.innerHTML = "";

  // tiny cache for fetched reports by slug
  const reportCache = new Map();

  // helper to fetch a report for a history entry
  function getReportFetcher(run, allowDataFallback = false) {
    const slug = slugFromDate(run.date);
    const url = `./history/${slug}/test-results.json`;

    return async () => {
      if (reportCache.has(slug)) return reportCache.get(slug);

      // try history folder first
      let res = await fetch(url);
      if (!res.ok && allowDataFallback) {
        // sometimes the latest run is only in /data
        res = await fetch("./data/test-results.json");
      }
      if (!res.ok) throw new Error("report not found");

      const json = await res.json();
      reportCache.set(slug, json);
      return json;
    };
  }

  // 3) If we have history, pre-load and show the most recent run in the table
  if (history.length) {
    try {
      const latestReport = await getReportFetcher(history[0], true)();
      const latestStats = computeSectionFromReport(latestReport, sectionName);
      renderFeaturesTable(latestStats, history[0].date, history[0].duration);
    } catch {
      // fallback: try /data as a last resort
      try {
        const res = await fetch("./data/test-results.json");
        if (res.ok) {
          const json = await res.json();
          const stats = computeSectionFromReport(json, sectionName);
          renderFeaturesTable(stats, json?.stats?.startTime, (json?.stats?.duration || 0) / 1000);
        }
      } catch {}
    }
  }

  // 4) build the list (newest → oldest)
  history.forEach((run, idx) => {
    renderHistoryItem(historyList, run, sectionName, getReportFetcher(run, idx === 0));
  });
}

loadSection();
