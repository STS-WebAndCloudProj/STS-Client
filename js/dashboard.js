document.addEventListener("DOMContentLoaded", async () => {
  const scansTableBody = document.querySelector("#scansTable tbody");
  const risksTableBody = document.querySelector("#risksTable tbody");

  if (!scansTableBody || !risksTableBody) {
    console.error("One or both table elements not found.");
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/api/results");
    const results = await res.json();

    results.forEach(result => {
      // 🟡 טבלת SCANS - בלי עמודת Severity
      const scanRow = document.createElement("tr");
      scanRow.innerHTML = `
        <td>${result.url}</td>
          <td>${result.status}</td>
        <td>${new Date(result.createdAt).toLocaleString('he-IL')}</td>
      `;
      scansTableBody.appendChild(scanRow);

      // 🔴 טבלת RISKS - שורה לכל איום
      if (Array.isArray(result.threats)) {
        result.threats.forEach(threatObj => {
          const riskRow = document.createElement("tr");

          const threat = threatObj?.threat || "—";
          const vulnerability = threatObj?.vulnerability || "—";
          const severity = threatObj?.severity || "—";

          riskRow.innerHTML = `
            <td>${threat}</td>
            <td>${vulnerability}</td>
            <td><span class="severity ${severity.toLowerCase()}"></span> ${severity}</td>
            <td>${result.url}</td>
          `;

          risksTableBody.appendChild(riskRow);
        });
      }
    });
  } catch (err) {
    console.error("Error loading results or threats:", err);
    const errorRow = document.createElement("tr");
    errorRow.innerHTML = `<td colspan="4">Failed to load results.</td>`;
    risksTableBody.appendChild(errorRow);
  }
});
