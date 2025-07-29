window.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  // טעינה של סקריפטים לפי הדף
  if (path.includes("index.html")) {
    import("./dashboard.js");
  }

  else if (path.includes("login.html")) {
    import("./login.js");
  }

  else if (path.includes("signup.html")) {
    import("./signup.js");
  }

  else if (path.includes("new_scan_step2.html")) {
    import("./scan-config.js");
  }

  // לכל הדפים נטען את הסקריפט הכללי
  import("./scan-common.js");
});
