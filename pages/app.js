async function loadLatestReport() {
  const res = await fetch('data/history/latest.json');
  const data = await res.json();
  updateUI(data);
}

function updateUI(data) {
  document.querySelector("#overall-pass span").innerText = data.overall.passRate + '%';
  document.querySelector("#passed span").innerText = data.overall.passed;
  document.querySelector("#failed span").innerText = data.overall.failed;
  document.querySelector("#last-run span").innerText = new Date(data.timestamp).toLocaleString();

  const sectionContainer = document.getElementById("section-cards");
  sectionContainer.innerHTML = '';
  Object.entries(data.sections).forEach(([name, stats]) => {
    const passRate = Math.round((stats.passed / (stats.passed + stats.failed)) * 100);
    const color = passRate >= 80 ? 'green' : passRate >= 50 ? 'yellow' : 'red';

    const div = document.createElement('div');
    div.className = `test-section ${color}`;
    div.innerHTML = `
      <h3>${name} tests</h3>
      <p>Passed: ${stats.passed}</p>
      <p>Failed: ${stats.failed}</p>
      <p>Pass rate: ${passRate}%</p>
    `;
    sectionContainer.appendChild(div);
  });

  const topSections = document.getElementById("top-sections");
  topSections.innerHTML = data.top_sections.map(s => `<li>${s.name} - ${s.passRate}%</li>`).join("");

  const topFeatures = document.getElementById("top-features");
  topFeatures.innerHTML = data.top_features.map(f => `<li>${f} (Fails: ${f.count})</li>`).join("");

  const topFailed = document.getElementById("top-failed");
  topFailed.innerHTML = data.top_failed_cases.map(t => `<li>${t.name} (${t.count})</li>`).join("");
}

loadLatestReport();
