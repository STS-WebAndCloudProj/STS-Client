window.addEventListener("DOMContentLoaded", () => {
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
});
