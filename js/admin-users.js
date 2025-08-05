// זה מתוך הסקריפט הראשון
document.addEventListener('DOMContentLoaded', function () {
  const suspendLinks = document.querySelectorAll(".suspend-user-link");

  suspendLinks.forEach(link => {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      const row = this.closest('tr');

      const emailCell = row.querySelector('td:nth-child(2)');
      const email = emailCell.textContent.trim();

      document.getElementById('suspendUserEmail').textContent = email;

      const modal = new bootstrap.Modal(document.getElementById('suspendUserModal'));
      modal.show();
    });
  });
});

// זה מתוך הסקריפט השני
document.getElementById("suspendBtn").addEventListener("click", function () {
  const duration = document.querySelector('input[name="suspendDuration"]:checked').value;

  const today = new Date();
  today.setDate(today.getDate() + parseInt(duration));

  const formattedDate = today.toLocaleDateString('en-GB'); // dd/mm/yyyy

  document.getElementById("suspension-end-date").textContent = formattedDate;

  const suspendModal = bootstrap.Modal.getInstance(document.getElementById("suspendUserModal"));
  suspendModal.hide();

  const confirmModal = new bootstrap.Modal(document.getElementById("suspendConfirmationModal"));
  confirmModal.show();
});

// זה מתוך הסקריפט השלישי
document.addEventListener('DOMContentLoaded', function () {
  const statusFilter = document.getElementById('statusFilter');
  const planFilter = document.getElementById('PlanFilter');
  const rows = document.querySelectorAll('#user-table tbody tr');

  function applyFilters() {
    const selectedStatus = statusFilter.value !== 'Status' ? statusFilter.value.toLowerCase() : null;
    const selectedPlan = planFilter.value !== 'Plan' ? planFilter.value.toLowerCase() : null;

    rows.forEach(row => {
      const rowStatus = row.getAttribute('data-status')?.toLowerCase();
      const rowPlan = row.getAttribute('data-plan')?.toLowerCase();

      const matchStatus = !selectedStatus || rowStatus === selectedStatus;
      const matchPlan = !selectedPlan || rowPlan === selectedPlan;

      if (!selectedStatus && !selectedPlan) {
        row.style.display = '';
      } else {
        row.style.display = matchStatus && matchPlan ? '' : 'none';
      }
    });
  }

  statusFilter.addEventListener('change', applyFilters);
  planFilter.addEventListener('change', applyFilters);
});
