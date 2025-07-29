window.onload = () => {
  // ===== טיפול באייקון סיסמה =====
  const toggleIcon = document.querySelector('.toggle-password');
  if (toggleIcon) {
    toggleIcon.addEventListener('click', function () {
      const input = this.previousElementSibling;
      input.type = input.type === 'password' ? 'text' : 'password';
      this.innerHTML = `<i class="far fa-eye${input.type === 'password' ? '' : '-slash'}"></i>`;
    });
  }

  // ===== אפקט ריחוף על כפתור New Scan =====
  const new_scan_btn = document.getElementById("new-scan-btn");
  const new_scan_img = document.getElementById("new-scan-img");

  if (new_scan_btn && new_scan_img) {
    new_scan_btn.addEventListener("mouseenter", () => {
      new_scan_img.src = "./images/new_scan_yellow.png";
    });

    new_scan_btn.addEventListener("mouseleave", () => {
      new_scan_img.src = "./images/new_scan.png";
    });
  }

  // ===== תצורת תזמון לסריקה חדשה (step 2) =====
  const radios = document.querySelectorAll('input[name="scheduleType"]');
  const subSections = document.querySelectorAll('.sub-options');

  if (radios.length > 0 && subSections.length > 0) {
    subSections.forEach(sec => sec.style.display = 'none');
    const selectedRadio = document.querySelector('input[name="scheduleType"]:checked');
    if (selectedRadio) {
      const selectedSection = document.getElementById(selectedRadio.id + 'Options');
      if (selectedSection) selectedSection.style.display = 'block';
    }

    radios.forEach(radio => {
      radio.addEventListener('change', () => {
        subSections.forEach(sec => sec.style.display = 'none');
        const selected = document.getElementById(radio.id + 'Options');
        if (selected) selected.style.display = 'block';
      });
    });
  }

  // ===== תזמון ידני מול "עכשיו" =====
  const nowRadio = document.getElementById('now');
  const scheduledRadio = document.getElementById('scheduled');
  const scheduledInput = document.getElementById('scheduledTime');

  if (nowRadio && scheduledRadio && scheduledInput) {
    nowRadio.addEventListener('change', () => {
      scheduledInput.disabled = true;
    });
    scheduledRadio.addEventListener('change', () => {
      scheduledInput.disabled = false;
    });
  }

  // ===== טעינת תוצאות ל-Recent risks בדשבורד =====
  const resultsTableBody = document.querySelector("#results-body");
  if (resultsTableBody) {
    fetch("http://localhost:3000/api/results")
      .then((res) => res.json())
      .then((data) => {
        resultsTableBody.innerHTML = "";

        data.forEach((result) => {
          result.threats.forEach((threat) => {
            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${threat}</td>
              <td>—</td>
              <td><span class="severity-dot ${result.severity.toLowerCase()}"></span> ${result.severity}</td>
              <td>${result.url}</td>
            `;
            resultsTableBody.appendChild(row);
          });
        });
      })
      .catch((err) => {
        console.error("Error loading results:", err);
        resultsTableBody.innerHTML = `<tr><td colspan="4">Failed to load results.</td></tr>`;
      });
  }
};
