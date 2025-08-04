document.addEventListener("DOMContentLoaded", () => {
  // const serverUrl = 'http://localhost:3000/api';
  const serverUrl = "https://sts-server-cjv3.onrender.com/api";
  const loginForm = document.querySelector("form");
  const emailInput = loginForm.querySelector('input[type="email"]');
  const passwordInput = loginForm.querySelector('input[type="password"]');
  const alertContainer = document.getElementById("alertContainer");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showAlert("Please enter both email and password.", "danger");
      return;
    }

    try {
      const response = await fetch(`${serverUrl}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Optionally check status in response
        if (data.user && data.user.status && data.user.status !== "active") {
          showAlert(`Your account status is '${data.user.status}'. Access denied.`, "danger");
          return;
        }
        showAlert("Login successful! Redirecting...", "success");
        sessionStorage.setItem("user", JSON.stringify(data.user));
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);
      } else {
        // Show message if backend sent a status denial
        const message = data.message || data.error || "Login failed. Please try again.";
        showAlert(message, "danger");
      }
    } catch (error) {
      console.error("Login error:", error);
      showAlert(
        "An unexpected error occurred. Please try again later.",
        "danger"
      );
    }
  });

  function showAlert(message, type) {
    const icon =
      type === "success" ? "#check-circle-fill" : "#exclamation-triangle-fill";
    alertContainer.innerHTML = `
            <div class="alert alert-${type} d-flex align-items-center shadow" role="alert">
                <svg class="bi flex-shrink-0 me-2" role="img" aria-label="${type}"><use xlink:href="${icon}"/></svg>
                <div>${message}</div>
            </div>
        `;
    setTimeout(() => {
      alertContainer.innerHTML = "";
    }, 4000);
  }

  // Password toggle
  const togglePassword = document.querySelector(".toggle-password");
  if (togglePassword) {
    togglePassword.addEventListener("click", () => {
      const type =
        passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);
      togglePassword.innerHTML = `<i class="far fa-eye${
        type === "password" ? "" : "-slash"
      }"></i>`;
    });
  }
});