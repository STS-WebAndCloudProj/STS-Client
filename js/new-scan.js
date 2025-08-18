let userId;
const SERVER_URL = "https://sts-server-cjv3.onrender.com/api";
// const SERVER_URL = 'http://localhost:3000/api'; // For local development

// Alert function to display Bootstrap-styled alerts
function showAlert(message, type) {
  const alertContainer = document.getElementById("alertContainer");
  if (!alertContainer) {
    console.error("Alert container not found!");
    alert(message); // Fallback to regular alert
    return;
  }
  
  const icon = type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill";
  alertContainer.innerHTML = `
    <div class="alert alert-${type} d-flex align-items-center shadow" role="alert" style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; width: auto; max-width: 500px;">
      <i class="bi ${icon} flex-shrink-0 me-2" role="img" aria-label="${type}"></i>
      <div>${message}</div>
    </div>
  `;
  setTimeout(() => {
    alertContainer.innerHTML = "";
  }, 4000);
}

// Main initialization function - runs when DOM is loaded
window.addEventListener("DOMContentLoaded", async () => {
  // Initialize user session and validate authentication
  if (!initializeUserSession()) return;
  
  // Get required DOM elements
  const urlsTableBody = document.querySelector("#target-table tbody");
  if (!validateRequiredElements(urlsTableBody)) return;

  // Setup all UI interactions and event listeners
  setupUserInterface();
  
  // Load and display existing URLs for the user
  await loadUserUrls(urlsTableBody);
});

// Initialize user session and validate authentication
// Returns: true if user is authenticated, false otherwise
function initializeUserSession() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  if (!user) {
    console.error("User not found in session storage.");
    window.location.href = "login.html";
    return false;
  }
  
  userId = user.userId;
  console.log("User authenticated:", userId);
  return true;
}

// Validate that required DOM elements exist
// urlsTableBody: The table body element for URLs
// Returns: True if all required elements exist
function validateRequiredElements(urlsTableBody) {
  if (!urlsTableBody) {
    console.error("No #target-table tbody found in the DOM!");
    return false;
  }
  return true;
}

// Setup all UI interactions and event listeners
function setupUserInterface() {
  // Setup form interactions
  setupScheduleTypeRadios();
  setupScheduleTimeToggle();
  setupNewScanButton();
  setupStepperNavigation();
  setupScanTypeCheckboxes();
  
  // Setup navigation and modal handlers
  setupLogoutHandler();
  setupConfirmModalHandler();
  setupAddTargetModalHandler();
  setupAccessibilityHandlers();
}

// Setup logout functionality
function setupLogoutHandler() {
  document.getElementById("logout").addEventListener("click", function (e) {
    e.preventDefault();
    sessionStorage.removeItem("user");
    window.location.href = "login.html";
  });
}

// Setup confirm scan modal handler
function setupConfirmModalHandler() {
  document
    .querySelector("#confirmRunModal .btn-submit")
    ?.addEventListener("click", async () => {
      const modalEl = document.getElementById("confirmRunModal");
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal?.hide(); // Close modal

      await handleSubmitScan(userId, SERVER_URL);
    });
}

// Setup accessibility handlers to prevent focus issues
function setupAccessibilityHandlers() {
  document.querySelectorAll(".close-btn").forEach((btn) => {
    btn.addEventListener("click", () => btn.blur());
  });
}

// Load and display user's existing URLs in the table
// Takes: urlsTableBody - the table element to fill with URL data
async function loadUserUrls(urlsTableBody) {
  try {
    const urlRes = await fetch(`${SERVER_URL}/urls/${userId}`);
    if (!urlRes.ok) throw new Error("Failed to fetch URLs");
    
    const urls = await urlRes.json();
    console.log("Loaded URLs:", urls);

    populateUrlsTable(urls, urlsTableBody);
  } catch (err) {
    console.error("Error fetching URLs:", err);
    tableError(urlsTableBody, "Failed to load URLs.");
  }
}

// Setup add target modal functionality with URL validation
function setupAddTargetModalHandler() {
  document
    .querySelector("#exampleModalCenter .btn-submit")
    ?.addEventListener("click", async () => {
      const urlInput = document.getElementById("target-url");
      const labelInput = document.getElementById("target-label");
      const url = urlInput.value.trim();
      const label = labelInput.value.trim();

      if (!url) {
        showAlert('Please enter a valid URL.', 'danger');
        urlInput.classList.add("is-invalid");
        return;
      } else {
        urlInput.classList.remove("is-invalid");
      }

      try {
        // Make an API call to validate and add the URL
        const res = await fetch(`${SERVER_URL}/urls`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            url,
            label,
          }),
        });

        if (!res.ok) {
          // If the backend rejects the URL, display an error message
          const errorData = await res.json();
          showAlert(`Error: ${errorData.error}`, 'danger');
          console.error('Threats:', errorData.threats);
          return;
        }

        // If the URL is safe, close modal and clear inputs
        const modalEl = document.getElementById("exampleModalCenter");
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal?.hide();

        // Clear inputs
        urlInput.value = "";
        labelInput.value = "";

        // Refresh table to show the new URL
        const urlRes = await fetch(`${SERVER_URL}/urls/${userId}`);
        const urls = await urlRes.json();
        populateUrlsTable(urls, document.querySelector("#target-table tbody"));
      } catch (error) {
        console.error('Error adding URL:', error);
        showAlert('Failed to add URL. Please try again later.', 'danger');
      }
    });
}

// Populate the URLs table with data from the server
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
      <td class="date-cell">${new Date(urlObj.createdAt).toLocaleString("he-IL")}</td>
    `;
    urlsTableBody.appendChild(row);
  });
  
  // Setup single checkbox selection behavior
  setupSingleCheckboxSelection(urlsTableBody);
};

// Display error message in table when data loading fails
function tableError(tableBody, message) {
  tableBody.innerHTML = `
    <tr>
      <td colspan="4" class="text-center text-danger">
        ${message}
      </td>
    </tr>
  `;
}

// Setup single checkbox selection behavior for the URLs table
function setupSingleCheckboxSelection(urlsTableBody) {
  const checkboxes = urlsTableBody.querySelectorAll('input.form-check-input[type="checkbox"]');
  
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

// =============================================================================
// SCAN SUBMISSION FUNCTIONS
// =============================================================================

// Handle scan submission when Confirm button is pressed
// userId: number - User ID for the scan
// serverUrl: string - Server URL for API calls
async function handleSubmitScan(userId, serverUrl) {
  try {
    const { selectedUrls, scheduledFor } = collectScanFormData();

    if (selectedUrls.length === 0) {
      showAlert("Please select at least one target URL.", "danger");
      return;
    }

    await submitScansToServer(userId, serverUrl, selectedUrls, scheduledFor);
    showAlert("Scans submitted successfully!", "success");
    console.log("Scans submitted successfully!");
    setTimeout(() => {
      window.location.href = "index.html"; // Redirect to dashboard
    }, 1500);
  } catch (err) {
    console.error("Scan submission failed:", err);
    showAlert("Failed to submit scans. Please try again.", "danger");
  }
}

// Collect selected test types, URLs, and schedule information from the form
function collectScanFormData() {
  // Get selected target URLs
  const selectedTargetRows = Array.from(
    document.querySelectorAll("#target-table tbody tr")
  ).filter((row) => row.querySelector("input.form-check-input:checked"));

  const selectedUrls = selectedTargetRows.map((row) => ({
    url: row.querySelector(".url-cell")?.textContent.trim(),
    label: row.querySelector(".label-cell")?.textContent.trim(),
  }));

  // Get schedule information
  const scheduleType = document.querySelector('input[name="scheduleType"]:checked')?.id;
  let scheduledFor = null;

  // Check if it's oneTime and scheduled (not "now")
  if (scheduleType === "oneTime") {
    const scheduledRadio = document.getElementById("scheduled");
    if (scheduledRadio && scheduledRadio.checked) {
      const time = document.querySelector('#oneTimeOptions input[type="time"]')?.value;
      const date = document.querySelector('#oneTimeOptions input[type="date"]')?.value;
      if (time && date) {
        scheduledFor = new Date(`${date}T${time}`).toISOString();
      }
    }
    // If "now" radio is checked, scheduledFor remains null
  } else if (scheduleType && scheduleType !== "oneTime") {
    // For other schedule types (daily, weekly, monthly, quarterly)
    // These are always scheduled, so we need to set a future time
    // For now, we'll set scheduledFor to indicate it's scheduled
    scheduledFor = new Date(Date.now() + 60000).toISOString(); // 1 minute from now as placeholder
  }

  return { selectedUrls, scheduledFor };
}

// Submit scans to the server for each selected URL
async function submitScansToServer(userId, serverUrl, selectedUrls, scheduledFor) {
  // Fetch all user URLs to match against selected ones
  const res = await fetch(`${serverUrl}/urls/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch user URLs");

  const urls = await res.json();
  console.log("Fetched URLs:", urls); // Debugging

  // Process each selected URL
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
    const scan = scanResponse.scan; // Server returns { message, scan }

    // Only run scan immediately if it's scheduled for "Now" (scheduledFor is null)
    if (!scheduledFor) {
      console.log("Running immediate scan for:", scan.scanId);

      // Post results for immediate scan
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

      // Update status to completed for immediate scan
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
    } else {
      // For scheduled scans, just log that they were scheduled
      console.log(`Scan scheduled for ${scheduledFor}:`, scan.scanId);
    }
  }
}

// =============================================================================
// UI SETUP AND EVENT HANDLERS
// =============================================================================

// Setup scan type checkboxes to allow only single selection
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

// Setup schedule type radio buttons to show/hide schedule sub-sections
function setupScheduleTypeRadios() {
  const radios = document.querySelectorAll('input[name="scheduleType"]');
  const allOptions = document.querySelectorAll(".sub-options");

  // Initially hide all options
  allOptions.forEach((opt) => (opt.style.display = "none"));
  
  // Show options for currently checked radio
  const checked = document.querySelector('input[name="scheduleType"]:checked');
  if (checked) {
    const section = document.getElementById(checked.id + "Options");
    if (section) section.style.display = "block";
  }

  // Add change listeners to all radios
  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      allOptions.forEach((opt) => (opt.style.display = "none"));
      const section = document.getElementById(radio.id + "Options");
      if (section) section.style.display = "block";
    });
  });
}

// Enable/disable time picker based on OneTime → Now vs Scheduled selection
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

    // Set initial state
    if (nowRadio.checked) {
      timeInput.disabled = true;
      dateInput.disabled = true;
    }
  }
}

// Setup hover effect on New Scan navigation button
function setupNewScanButton() {
  const newScanBtn = document.getElementById("selected-new-scan");
  const newScanImg = document.getElementById("new-scan-img");

  if (newScanBtn && newScanImg) {
    // Set initial state to regular image
    newScanImg.src = "./images/new_scan.png";
    
    // Hover effects - change to yellow on hover
    newScanBtn.addEventListener("mouseenter", () => {
      newScanImg.src = "./images/new_scan_yellow.png";
    });
    
    newScanBtn.addEventListener("mouseleave", () => {
      newScanImg.src = "./images/new_scan.png"; // Back to regular image
    });
    
    // Click behavior - scroll to top since we're already on the page
    newScanBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

// =============================================================================
// STEPPER NAVIGATION FUNCTIONS
// =============================================================================

// Setup stepper navigation with previous/next functionality
function setupStepperNavigation() {
  let currentStep = 1;
  const totalSteps = 3;

  // Show the specified step and update UI accordingly
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

    // When entering step 3 (review), update the review section
    if (step === 3) updateReviewSection();
  }

  // Initialize to first step
  showStep(1);

  // Setup next step buttons
  document.querySelectorAll(".next-step-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      showStep(Math.min(currentStep + 1, totalSteps));
    });
  });

  // Setup previous step buttons
  document.querySelectorAll(".prev-step-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      showStep(Math.max(currentStep - 1, 1));
    });
  });
}

// Update the review section (step 3) with current form data
function updateReviewSection() {
  updateScanTypeReview();
  updateTargetsReview();
  updateScheduleReview();
}

// Update scan type information in review section
function updateScanTypeReview() {
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
}

// Update targets information in review section
function updateTargetsReview() {
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
}

// Update schedule information in review section
function updateScheduleReview() {
  const scheduleType = document.querySelector('input[name="scheduleType"]:checked');
  let repeat = "—";
  let startTime = "—";
  
  if (scheduleType) {
    repeat = scheduleType.labels[0].textContent;
    
    if (scheduleType.id === "oneTime") {
      const nowRadio = document.getElementById("now");
      const scheduledRadio = document.getElementById("scheduled");
      const time = document.querySelector('#oneTimeOptions input[type="time"]')?.value;
      const date = document.querySelector('#oneTimeOptions input[type="date"]')?.value;
      
      if (nowRadio.checked) {
        startTime = "Now";
      } else if (scheduledRadio.checked && date && time) {
        startTime = `${date} ${time}`;
      } else if (scheduledRadio.checked) {
        startTime = "Scheduled (missing date/time)";
      }
    } else if (scheduleType.id === "daily") {
      const time = document.querySelector('#dailyOptions input[type="time"]')?.value;
      const days = document.querySelector('#dailyOptions input[type="number"]')?.value;
      startTime = time ? `Every ${days || 1} day(s) at ${time}` : "—";
    } else if (scheduleType.id === "weekly") {
      const time = document.querySelector('#weeklyOptions input[type="time"]')?.value;
      const days = Array.from(
        document.querySelectorAll('#weeklyOptions input[type="checkbox"]:checked')
      ).map((cb) => cb.value).join(", ");
      startTime = time ? `Weekly on ${days} at ${time}` : "—";
    } else if (scheduleType.id === "monthly") {
      const day = document.querySelector('#monthlyOptions input[type="number"]')?.value;
      const time = document.querySelector('#monthlyOptions input[type="time"]')?.value;
      startTime = day && time ? `Day ${day} at ${time}` : "—";
    } else if (scheduleType.id === "quarterly") {
      const month = document.querySelector("#quarterlyOptions select")?.value;
      const day = document.querySelector('#quarterlyOptions input[type="number"]')?.value;
      const time = document.querySelector('#quarterlyOptions input[type="time"]')?.value;
      startTime = month && day && time ? `${month} ${day} at ${time}` : "—";
    }
  }
  
  document.querySelector("#schedule-summary .summary-value").textContent = repeat;
  document.querySelectorAll("#schedule-summary .summary-item")[1]
    .querySelector(".summary-value").textContent = startTime;
}