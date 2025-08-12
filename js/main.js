Object.entries(sections).forEach(([sectionName, s]) => {
  const denom = s.passed + s.failed;
  const passRate = denom ? (s.passed / denom * 100) : 0;
  let borderColor = 'border-green-500';
  if (passRate < 50) borderColor = 'border-red-500';
  else if (passRate < 80) borderColor = 'border-yellow-500';

  const card = document.createElement('a');
  card.href = `section.html?name=${encodeURIComponent(sectionName)}`;
  card.className = `border-2 rounded-lg p-4 block ${borderColor} bg-white shadow hover:shadow-lg`;
  card.innerHTML = `
    <h3 class="text-lg font-bold">${sectionName}</h3>
    <div class="mt-1 text-sm">
      <div>Passed: <strong>${s.passed}</strong></div>
      <div>Failed: <strong class="text-red-600">${s.failed}</strong></div>
      <div class="mt-1 font-semibold">Pass rate: ${denom ? passRate.toFixed(1) + '%' : 'N/A'}</div>
    </div>
    <div class="mt-2 text-xs text-gray-500">Click to view features</div>
  `;
  sectionCards.appendChild(card);
});
