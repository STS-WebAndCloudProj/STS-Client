window.addEventListener("DOMContentLoaded", () => {
  const radios = document.querySelectorAll('input[name="scheduleType"]');
  const subSections = document.querySelectorAll('.sub-options');

  if (radios.length > 0 && subSections.length > 0) {
    subSections.forEach(sec => sec.style.display = 'none');
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
  }

  const nowRadio = document.getElementById('now');
  const scheduledRadio = document.getElementById('scheduled');
  const scheduledInput = document.getElementById('scheduledTime');

  if (nowRadio && scheduledRadio && scheduledInput) {
    nowRadio.addEventListener('change', () => scheduledInput.disabled = true);
    scheduledRadio.addEventListener('change', () => scheduledInput.disabled = false);
  }
});
