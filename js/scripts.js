window.onload = () => {
    const new_scan_btn = document.getElementById("new-scan-btn");
    const new_scan_img = document.getElementById("new-scan-img");

    new_scan_btn.addEventListener("mouseenter", () => {
        new_scan_img.src = "./images/new_scan_yellow.png";
    });

    new_scan_btn.addEventListener("mouseleave", () => {
        new_scan_img.src = "./images/new_scan.png";
    });

    // document.addEventListener('DOMContentLoaded', function () {
    //     const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-toggle="tooltip"], [data-bs-toggle="tooltip"]'));
    //     tooltipTriggerList.forEach(function (tooltipTriggerEl) {
    //         new bootstrap.Tooltip(tooltipTriggerEl);
    //     });
    // });

};


