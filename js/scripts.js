document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(sessionStorage.getItem("user"));
  if (!user) {
    console.error("User not found in session storage.");
    window.location.href = "login.html";
    return;
  }
  userId = user.userId;
  // logout function
  document.getElementById("logout").addEventListener("click", function (e) {
    e.preventDefault();
    sessionStorage.removeItem("user");
    window.location.href = "login.html";
  });
  
  // new scan event listener
  const newScanBtn = document.getElementById("new-scan-btn");
  if (newScanBtn) {
    newScanBtn.addEventListener("click", () => {
      window.location.href = "new_scan.html";
    });
  }
});


