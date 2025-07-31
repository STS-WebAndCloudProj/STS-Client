window.addEventListener("DOMContentLoaded", () => {
    //scan-config.js: enhances the configuration step of your scan form by managing dynamic visibility 
    //                and enabling/disabling inputs based on user choices.

    console.log("New scan JS loaded");
    const radios = document.querySelectorAll('input[name="scheduleType"]');
    const subSections = document.querySelectorAll('.sub-options');

    if (radios.length > 0 && subSections.length > 0) {
        subSections.forEach(sec => sec.style.display = 'none');
        const selectedRadio = document.querySelector('input[name="scheduleType"]:checked');
        if (selectedRadio) {
            const selectedSection = document.getElementById(selectedRadio.id + 'Options');
            if (selectedSection) selectedSection.style.display = 'block';
        }

        //Hide all .sub-options
        //Show only the section matching the selected radio (id + "Options")
        radios.forEach(radio => {
            radio.addEventListener('change', () => {
                subSections.forEach(sec => sec.style.display = 'none');
                const selected = document.getElementById(radio.id + 'Options');
                if (selected) selected.style.display = 'block';
            });
        });
    }

    //If "now" is selected, it disables the datetime input
    // If "scheduled" is selected, it enables the datetime input
    const nowRadio = document.getElementById('now');
    const scheduledRadio = document.getElementById('scheduled');
    const scheduledInput = document.getElementById('scheduledTime');

    if (nowRadio && scheduledRadio && scheduledInput) {
        nowRadio.addEventListener('change', () => scheduledInput.disabled = true);
        scheduledRadio.addEventListener('change', () => scheduledInput.disabled = false);
    }

    //scan-common.js: 
    //creates a visual hover effect: when the user hovers over the “New Scan” button, the icon changes to a yellow version to signal interactivity
    //and reverts back to the original icon when the mouse leaves the button.

    // const new_scan_btn = document.getElementById("new-scan-btn");
    // const new_scan_img = document.getElementById("new-scan-img");

    // if (new_scan_btn && new_scan_img) {
    //     new_scan_btn.addEventListener("mouseenter", () => {
    //         new_scan_img.src = "./images/new_scan_yellow.png";
    //     });

    //     new_scan_btn.addEventListener("mouseleave", () => {
    //         new_scan_img.src = "./images/new_scan.png";
    //     });
    // }

    const newScanBtn = document.getElementById("selected-new-scan");
    const newScanImg = document.getElementById("new-scan-img");

    // Track selected state
    let isSelected = true; // Set this to true if the page is "New Scan"

    if (newScanBtn && newScanImg) {
        const updateImage = () => {
            if (isSelected) {
                newScanImg.src = "./images/new_scan.png";
            } else {
                newScanImg.src = "./images/new_scan_yellow.png";
            }
        };

        // Initial image
        updateImage();

        newScanBtn.addEventListener("mouseenter", () => {
            if (isSelected) {
                newScanImg.src = "./images/new_scan_yellow.png"; // Hover over selected
            } else {
                newScanImg.src = "./images/new_scan.png"; // Hover over unselected
            }
        });

        newScanBtn.addEventListener("mouseleave", () => {
            updateImage();
        });

        // If you want clicking it to toggle the selection
        newScanBtn.addEventListener("click", () => {
            isSelected = true; // If only one selected allowed, you can set others to false
            updateImage();
        });
    }


    //step and form navigation
    //controls how the user moves between Step 1 → Step 2 → Step 3, and ensures both the content and the stepper UI update accordingly.

    let currentStep = 1;
    const totalSteps = 3;

    function showStep(step) {
        for (let i = 1; i <= totalSteps; i++) {
            const section = document.getElementById(`step-${i}`);
            const stepper = document.getElementById(`stepper-${i}`);
            const line = stepper?.querySelector(".line");

            if (section) section.style.display = i === step ? "block" : "none";
            if (stepper) stepper.classList.toggle("active", i === step);
            if (line) line.classList.toggle("active", i <= step);
        }
        currentStep = step;
    }

    showStep(1); // Start with step 1

    document.querySelectorAll(".next-step-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            showStep(Math.min(currentStep + 1, totalSteps));
        });
    });

    document.querySelectorAll(".prev-step-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            showStep(Math.max(currentStep - 1, 1));
        });
    });
});