window.addEventListener("DOMContentLoaded", async () => {
  // const serverUrl = 'http://localhost:3000/api';
  const serverUrl = "https://sts-server-cjv3.onrender.com/api";
  const user = JSON.parse(sessionStorage.getItem("user"));
  if (!user) {
    console.error("User not found in session storage.");
    window.location.href = "login.html";
    return;
  }
  userId = user.userId;
  console.log("target-table:", document.getElementById("target-table"));
  console.log("tbody:", document.querySelector("#target-table tbody"));

  const urlsTableBody = document.querySelector("#target-table tbody");
  if (!urlsTableBody) {
    console.error("No #target-table tbody found in the DOM!");
    return;
  }

  // Setup interactions
  setupScheduleTypeRadios();
  setupScheduleTimeToggle();
  setupNewScanButton();
  setupStepperNavigation();
  setupScanTypeCheckboxes();

  document.getElementById("logout").addEventListener("click", function (e) {
    e.preventDefault();
    sessionStorage.removeItem("user");
    window.location.href = "login.html";
  });

  // Modal Confirm Button → Only then we submit
  document
    .querySelector("#confirmRunModal .btn-submit")
    ?.addEventListener("click", async () => {
      const modalEl = document.getElementById("confirmRunModal");
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal?.hide(); // Close modal

      await handleSubmitScan(userId, serverUrl);
    });

  // Prevent aria-hidden issues
  document.querySelectorAll(".close-btn").forEach((btn) => {
    btn.addEventListener("click", () => btn.blur());
  });

  //URL table update
  try {
    const urlRes = await fetch(`${serverUrl}/urls/${userId}`);
    if (!urlRes.ok) throw new Error("Failed to fetch scans");
    const urls = await urlRes.json();
    console.log("Urls:", urls); // delete after debugging

    populateUrlsTable(urls, urlsTableBody);
  } catch (err) {
    console.error("Error fetching scans:", err);
    tableError(urlsTableBody, "Failed to load urls.");
  }

  // Add Target Modal Submit
  document
    .querySelector("#exampleModalCenter .btn-submit")
    ?.addEventListener("click", async () => {
      const urlInput = document.getElementById("target-url");
      const labelInput = document.getElementById("target-label");
      const url = urlInput.value.trim();
      const label = labelInput.value.trim();

      if (!url) {
        urlInput.classList.add("is-invalid");
        return;
      } else {
        urlInput.classList.remove("is-invalid");
      }

      // POST to backend
      try {
        const res = await fetch(`${serverUrl}/urls`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            url,
            label,
          }),
        });
        if (!res.ok) throw new Error("Failed to add target");
        // Optionally close modal
        const modalEl = document.getElementById("exampleModalCenter");
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal?.hide();

        // Clear inputs
        urlInput.value = "";
        labelInput.value = "";

        // Refresh table
        const urlRes = await fetch(`${serverUrl}/urls/${userId}`);
        const urls = await urlRes.json();
        populateUrlsTable(urls, document.querySelector("#target-table tbody"));
      } catch (err) {
        alert("Error adding target: " + err.message);
      }
    });
});

const populateUrlsTable = (urls, urlsTableBody) => {
  urlsTableBody.innerHTML = "";
  // Sort by createdAt descending (newest first)
  urls.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  urls.forEach((urlObj) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <th class="checkbox-th" scope="row">
              <input class="form-check-input" type="checkbox">
            </th>
            <td class="url-cell">${urlObj.url || "—"}</td>
            <td class="label-cell">${urlObj.label || "—"}</td>
            <td class="date-cell">${new Date(urlObj.createdAt).toLocaleString(
              "he-IL"
            )}</td>
        `;
    urlsTableBody.appendChild(row);
  });
  // Allow only one checkbox to be checked at a time
  const checkboxes = urlsTableBody.querySelectorAll(
    'input.form-check-input[type="checkbox"]'
  );
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      if (this.checked) {
        checkboxes.forEach((cb) => {
          if (cb !== this) cb.checked = false;
        });
      }
    });
  });
};

// 🔽 Called only when Confirm is pressed
async function handleSubmitScan(userId, serverUrl) {
  try {
    const { selectedUrls, scheduledFor } = collectScanFormData();

    if (selectedUrls.length === 0) {
      alert("Please select at least one target URL.");
      return;
    }

    await submitScansToServer(
      userId,
      serverUrl,
      selectedUrls,
      scheduledFor
    );
    alert("Scans submitted successfully!");
    console.log("Scans submitted successfully!");
    window.location.href = "index.html"; // ✅ Redirect
  } catch (err) {
    console.error("Scan submission failed:", err);
    alert("Failed to submit scans. Please try again.");
  }
}

// 🔽 Collect selected test types, URLs, schedule
function collectScanFormData() {
  // Targets selected
  const selectedTargetRows = Array.from(
    document.querySelectorAll("#target-table tbody tr")
  ).filter((row) => row.querySelector("input.form-check-input:checked"));

  const selectedUrls = selectedTargetRows.map((row) => ({
    url: row.querySelector(".url-cell")?.textContent.trim(),
    label: row.querySelector(".label-cell")?.textContent.trim(),
  }));

  // Schedule
  const scheduleType = document.querySelector(
    'input[name="scheduleType"]:checked'
  )?.id;
  let scheduledFor = null;

  if (scheduleType === "scheduled") {
    const time = document.querySelector('#step-2 input[type="time"]')?.value;
    const date = document.querySelector('#step-2 input[type="date"]')?.value;
    if (time && date) {
      scheduledFor = new Date(`${date}T${time}`).toISOString();
    }
  }

  return { selectedUrls, scheduledFor };
}

async function submitScansToServer(
  userId,
  serverUrl,
  selectedUrls,
  scheduledFor
) {
  const res = await fetch(`${serverUrl}/urls/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch user URLs");

  const urls = await res.json();
  console.log("Fetched URLs:", urls); // Debugging
  for (const target of selectedUrls) {
    const match = urls.find((u) => u.url === target.url);
    if (!match) {
      console.warn(`No matching URL found for: ${target.url}`);
      continue;
    }

    const payload = {
      scheduledFor,
      status: "pending",
    };

    // Create scan
    const scanRes = await fetch(`${serverUrl}/scans/${match.urlId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!scanRes.ok) {
      console.error(`Failed to create scan for ${target.url}`);
      continue;
    }

    const scanResponse = await scanRes.json();
    const scan = scanResponse.scan; // ✅ because server returns { message, scan }

    // If scheduledFor is null → run immediately
    if (!scheduledFor) {
      console.log("Running immediate scan for:", scan.scanId);

      // Post results
      const resultRes = await fetch(`${serverUrl}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          scanId: scan.scanId,
        }),
      });

      if (!resultRes.ok) {
        console.error(`Failed to post result for scan ${scan.scanId}`);
        continue;
      }

      // Update status to completed
      const updateRes = await fetch(
        `${serverUrl}/scans/${scan.scanId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed" }),
        }
      );

      if (!updateRes.ok) {
        console.error(`Failed to update scan status for ${scan.scanId}`);
      }
    }
  }
}

function setupScanTypeCheckboxes() {
  const checkboxes = document.querySelectorAll(
    '#checkbox-list input[type="checkbox"]'
  );
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      if (this.checked) {
        checkboxes.forEach((cb) => {
          if (cb !== this) cb.checked = false;
        });
      }
    });
  });
}

// 🔽 Show/hide schedule sub-sections
function setupScheduleTypeRadios() {
  const radios = document.querySelectorAll('input[name="scheduleType"]');
  const allOptions = document.querySelectorAll(".sub-options");

  allOptions.forEach((opt) => (opt.style.display = "none"));
  const checked = document.querySelector('input[name="scheduleType"]:checked');
  if (checked) {
    const section = document.getElementById(checked.id + "Options");
    if (section) section.style.display = "block";
  }

  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      allOptions.forEach((opt) => (opt.style.display = "none"));
      const section = document.getElementById(radio.id + "Options");
      if (section) section.style.display = "block";
    });
  });
}

// 🔽 Enable/disable time picker based on OneTime → Now vs Scheduled
function setupScheduleTimeToggle() {
  const nowRadio = document.getElementById("now");
  const scheduledRadio = document.getElementById("scheduled");
  const timeInput = document.querySelector('#step-2 input[type="time"]');
  const dateInput = document.querySelector('#step-2 input[type="date"]');

  if (nowRadio && scheduledRadio && timeInput && dateInput) {
    nowRadio.addEventListener("change", () => {
      timeInput.disabled = true;
      dateInput.disabled = true;
    });
    scheduledRadio.addEventListener("change", () => {
      timeInput.disabled = false;
      dateInput.disabled = false;
    });

    if (nowRadio.checked) {
      timeInput.disabled = true;
      dateInput.disabled = true;
    }
  }
}

// 🔽 Image hover effect on New Scan nav button
function setupNewScanButton() {
  const newScanBtn = document.getElementById("selected-new-scan");
  const newScanImg = document.getElementById("new-scan-img");
  let isSelected = true;

  if (newScanBtn && newScanImg) {
    const updateImg = () => {
      newScanImg.src = isSelected
        ? "./images/new_scan.png"
        : "./images/new_scan_yellow.png";
    };

    updateImg();
    newScanBtn.addEventListener("mouseenter", () => {
      newScanImg.src = isSelected
        ? "./images/new_scan_yellow.png"
        : "./images/new_scan.png";
    });
    newScanBtn.addEventListener("mouseleave", updateImg);
    newScanBtn.addEventListener("click", () => {
      isSelected = true;
      updateImg();
    });
  }
}

// 🔽 Stepper navigation logic
function setupStepperNavigation() {
  let currentStep = 1;
  const totalSteps = 3;

  function showStep(step) {
    for (let i = 1; i <= totalSteps; i++) {
      const section = document.getElementById(`step-${i}`);
      const stepper = document.getElementById(`stepper-${i}`);
      const line = stepper?.querySelector(".line");

      if (section) {
        section.style.display = i === step ? "flex" : "none";
        section.classList.toggle("active-step", i === step);
      }
      if (stepper) stepper.classList.toggle("active", i === step);
      if (line) line.classList.toggle("active", i <= step);
    }
    currentStep = step;
    // When entering step 3, update the review
    if (step === 3) updateReviewSection();
  }

  showStep(1);

  document.querySelectorAll(".next-step-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      showStep(Math.min(currentStep + 1, totalSteps));
    });
  });

  document.querySelectorAll(".prev-step-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      showStep(Math.max(currentStep - 1, 1));
    });
  });
}

function setupStepperNavigation() {
  let currentStep = 1;
  const totalSteps = 3;

  function showStep(step) {
    for (let i = 1; i <= totalSteps; i++) {
      const section = document.getElementById(`step-${i}`);
      const stepper = document.getElementById(`stepper-${i}`);
      const line = stepper?.querySelector(".line");

      if (section) {
        section.style.display = i === step ? "flex" : "none";
        section.classList.toggle("active-step", i === step);
      }
      if (stepper) stepper.classList.toggle("active", i === step);
      if (line) line.classList.toggle("active", i <= step);
    }
    currentStep = step;

    // When entering step 3, update the review
    if (step === 3) updateReviewSection();
  }

  showStep(1);

  document.querySelectorAll(".next-step-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      showStep(Math.min(currentStep + 1, totalSteps));
    });
  });

  document.querySelectorAll(".prev-step-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      showStep(Math.max(currentStep - 1, 1));
    });
  });
}

// Add this function to update the review section
function updateReviewSection() {
  // 1. Scan Type
  const scanTypeMap = {
    defaultCheck1: {
      title: "Opaque Box Testing",
      desc: "Opaque box: no internal system knowledge",
    },
    defaultCheck2: {
      title: "Semi-Opaque Box Testing",
      desc: "Semi-opaque box: limited internal visibility",
    },
    defaultCheck3: {
      title: "Transparent Box Testing",
      desc: "Transparent box: full access to system internals",
    },
  };
  const checkedScan = Array.from(
    document.querySelectorAll('#checkbox-list input[type="checkbox"]')
  ).find((cb) => cb.checked);
  const scanType = scanTypeMap[checkedScan?.id] || { title: "—", desc: "" };
  document.querySelector(".scan-type-title").textContent = scanType.title;
  document.querySelector(".scan-type-description").textContent = scanType.desc;

  // 2. Targets
  const selectedRows = Array.from(
    document.querySelectorAll("#target-table tbody tr")
  ).filter((row) => row.querySelector('input[type="checkbox"]').checked);
  const tbody = document.querySelector("#target-summary tbody");
  tbody.innerHTML = "";
  selectedRows.forEach((row) => {
    const url = row.querySelector(".url-cell")?.textContent || "";
    const label = row.querySelector(".label-cell")?.textContent || "";
    const date = row.querySelector(".date-cell")?.textContent || "";
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${url}</td><td>${label}</td><td>${date}</td>`;
    tbody.appendChild(tr);
  });
  if (selectedRows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3">No targets selected</td></tr>';
  }
  // 3. Schedule
  const scheduleType = document.querySelector(
    'input[name="scheduleType"]:checked'
  );
  let repeat = "—",
    startTime = "—";
  if (scheduleType) {
    repeat = scheduleType.labels[0].textContent;
    if (scheduleType.id === "oneTime") {
      const nowRadio = document.getElementById("now");
      const scheduledRadio = document.getElementById("scheduled");
      const time = document.querySelector(
        '#oneTimeOptions input[type="time"]'
      )?.value;
      const date = document.querySelector(
        '#oneTimeOptions input[type="date"]'
      )?.value;
      if (nowRadio.checked) {
        startTime = "Now";
      } else if (scheduledRadio.checked && date && time) {
        startTime = `${date} ${time}`;
      } else if (scheduledRadio.checked) {
        startTime = "Scheduled (missing date/time)";
      }
    } else if (scheduleType.id === "daily") {
      const time = document.querySelector(
        '#dailyOptions input[type="time"]'
      )?.value;
      const days = document.querySelector(
        '#dailyOptions input[type="number"]'
      )?.value;
      startTime = time ? `Every ${days || 1} day(s) at ${time}` : "—";
    } else if (scheduleType.id === "weekly") {
      const time = document.querySelector(
        '#weeklyOptions input[type="time"]'
      )?.value;
      const days = Array.from(
        document.querySelectorAll(
          '#weeklyOptions input[type="checkbox"]:checked'
        )
      )
        .map((cb) => cb.value)
        .join(", ");
      startTime = time ? `Weekly on ${days} at ${time}` : "—";
    } else if (scheduleType.id === "monthly") {
      const day = document.querySelector(
        '#monthlyOptions input[type="number"]'
      )?.value;
      const time = document.querySelector(
        '#monthlyOptions input[type="time"]'
      )?.value;
      startTime = day && time ? `Day ${day} at ${time}` : "—";
    } else if (scheduleType.id === "quarterly") {
      const month = document.querySelector("#quarterlyOptions select")?.value;
      const day = document.querySelector(
        '#quarterlyOptions input[type="number"]'
      )?.value;
      const time = document.querySelector(
        '#quarterlyOptions input[type="time"]'
      )?.value;
      startTime = month && day && time ? `${month} ${day} at ${time}` : "—";
    }
  }
  document.querySelector("#schedule-summary .summary-value").textContent =
    repeat;
  document
    .querySelectorAll("#schedule-summary .summary-item")[1]
    .querySelector(".summary-value").textContent = startTime;
}
