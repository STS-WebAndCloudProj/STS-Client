document.addEventListener("DOMContentLoaded", async () => {
  const serverUrl = 'http://localhost:3000/api';
  const scansTableBody = document.querySelector("#scansTable tbody");
  const risksTableBody = document.querySelector("#risksTable tbody");

  const cardCounters = {
    critical: document.querySelector(".custom-card.red-bg .card-val"),
    high: document.querySelector(".custom-card.orange-bg .card-val"),
    medium: document.querySelector(".custom-card.yellow-bg .card-val"),
    low: document.querySelector(".custom-card.green-bg .card-val")
  };

  const userId = '2dac878d-5bf2-4e14-813d-a0fbc6655ba2'; // Replace with dynamic user ID if needed

  try {
    const resultsRes = await fetch(`${serverUrl}/results/${userId}`);
    if (!resultsRes.ok) throw new Error("Failed to fetch results");
    const results = await resultsRes.json();
    console.log("Results:", results); // delete after debugging

    updateCardCounters(cardCounters, results);
    populateThreatsTable(results, risksTableBody);

  } catch (err) {
    console.error("Error fetching counters:", err);
    tableError(risksTableBody, "Failed to load threats.");
  }

  try {
    const scansRes = await fetch(`${serverUrl}/urls/${userId}`);
    if (!scansRes.ok) throw new Error("Failed to fetch scans");
    const scans = await scansRes.json();
    console.log("Scans:", scans); // delete after debugging

    populateScansTable(scans, scansTableBody);

  } catch (err) {
    console.error("Error fetching scans:", err);
    tableError(scansTableBody, "Failed to load scans.");
  }
});

const updateCardCounters = (cardCounters,results) => {
  const severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  results.forEach(result => {
    if (Array.isArray(result.threats)) {
      result.threats.forEach(threat => {
        const sevKey = threat.severity?.toLowerCase() || 'low';
        if (severityCounts[sevKey] !== undefined) {
          severityCounts[sevKey]++;
        }
      });
    }
  });

  Object.keys(cardCounters).forEach(sev => {
    cardCounters[sev].textContent = severityCounts[sev];
  });
}

const populateThreatsTable = (results, risksTableBody, count = 7) => {
  const allThreats = [];
  results.forEach(result => {
    if (Array.isArray(result.threats)) {
      result.threats.forEach(threat => {
        allThreats.push({
          ...threat,
          url: result.urlData?.url,
          scanDate: result.scanDate || result.createdAt
        });
      });
    }
  });
  const sortedThreats = allThreats.sort((a, b) => new Date(b.scanDate) - new Date(a.scanDate));
  const lastThreats = sortedThreats.slice(0, count);
  risksTableBody.innerHTML = '';
  lastThreats.forEach(threat => {
    const sevKey = threat.severity?.toLowerCase() || 'low';
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${threat.threat || "—"}</td>
      <td>${threat.vulnerability || "—"}</td>
      <td><span class="severity ${sevKey}"></span> ${threat.severity || "—"}</td>
      <td>${threat.url || "—"}</td>
    `;
    risksTableBody.appendChild(row);
  });
}

const populateScansTable = (scans, scansTableBody, urlIdToUrl) => {
  scansTableBody.innerHTML = '';
  const sortedScans = scans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const lastScans = sortedScans.slice(0, 5);
  lastScans.forEach(urlObj => {
    if (Array.isArray(urlObj.scans)) {
      urlObj.scans.forEach(scan => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${urlObj.url || "—"}</td>
          <td>${scan.status || "—"}</td>
          <td>${new Date(scan.createdAt).toLocaleString('he-IL')}</td>
        `;
        scansTableBody.appendChild(row);
      });
    }
  });
}

const tableError = (tableBody, message) => {
  tableBody.innerHTML = `<tr><td colspan="4">${message}</td></tr>`;
}