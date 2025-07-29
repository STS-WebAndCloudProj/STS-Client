document.addEventListener("DOMContentLoaded", () => {
    const serverUrl = 'http://localhost:3000/api';
    const signupForm = document.getElementById("signup-form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const alertContainer = document.getElementById("alertContainer");

    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const confirmPassword = document.getElementById("confirm-password").value.trim();

        if (!email || !password || !confirmPassword) {
            showAlert("Please fill in all fields.", "danger");
            return;
        }

        if (password !== confirmPassword) {
            showAlert("Passwords do not match.", "warning");
            return;
        }
        try {
            const response = await fetch(`${serverUrl}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                showAlert("Sign Up successful! Redirecting...", "success");
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } else {
                const message = data.message || "Sign Up failed. Please try again.";
                showAlert(message, "danger");
            }
        }   catch (error) {
            console.error("Sign Up error:", error); 
            showAlert("An unexpected error occurred. Please try again later.", "danger");
        }
    });

    function showAlert(message, type) {
        const icon = type === 'success' ? '#check-circle-fill' : '#exclamation-triangle-fill';
        alertContainer.innerHTML = `
            <div class="alert alert-${type} d-flex align-items-center shadow" role="alert">
                <svg class="bi flex-shrink-0 me-2" role="img" aria-label="${type}">
                    <use xlink:href="${icon}"/>
                </svg>
                <div>${message}</div>
            </div>
        `;
        setTimeout(() => {
            alertContainer.innerHTML = '';
        }, 4000);
    }

    // Toggle password visibility
    const toggleIcons = document.querySelectorAll(".toggle-password");
    toggleIcons.forEach(icon => {
        icon.addEventListener("click", () => {
            const input = icon.previousElementSibling;
            const type = input.getAttribute("type") === "password" ? "text" : "password";
            input.setAttribute("type", type);
            icon.innerHTML = `<i class="far fa-eye${type === 'password' ? '' : '-slash'}"></i>`;
        });
    });
});
