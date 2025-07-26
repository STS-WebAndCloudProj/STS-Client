window.onload = () => {
    const new_scan_btn = document.getElementById("new-scan-btn");
    const new_scan_img = document.getElementById("new-scan-img");

    new_scan_btn.addEventListener("mouseenter", () => {
        new_scan_img.src = "./images/new_scan_yellow.png";
    });

    new_scan_btn.addEventListener("mouseleave", () => {
        new_scan_img.src = "./images/new_scan.png";
    });

    // New Scan: Configure - Handle schedule type selection
    const radios = document.querySelectorAll('input[name="scheduleType"]');
    const subSections = document.querySelectorAll('.sub-options');

    // הסתרת כל האופציות כברירת מחדל
    subSections.forEach(sec => sec.style.display = 'none');

    // הצגת האפשרות שנבחרה כברירת מחדל (One Time)
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

    // Enable/Disable datetime input
    document.getElementById('now').addEventListener('change', () => {
        document.getElementById('scheduledTime').disabled = true;
    });
    document.getElementById('scheduled').addEventListener('change', () => {
        document.getElementById('scheduledTime').disabled = false;
    });
};
