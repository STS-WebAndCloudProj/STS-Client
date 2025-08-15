// Initializes suspend user functionality - handles clicks on suspend links
document.addEventListener("DOMContentLoaded", async () => {
  const serverUrl = 'http://localhost:3000/api';
  // const serverUrl = 'https://sts-server-cjv3.onrender.com/api';
  const suspendLinks = document.querySelectorAll(".suspend-user-link");

  // Check if user is logged in
  const user = JSON.parse(sessionStorage.getItem("user"));
  if (!user) {
    console.error("User not found in session storage.");
    window.location.href = "login.html";
    return;
  }

  // Load user statistics when page loads
  await loadUserStats();
  // Load users table when page loads
  await loadUsersTable();

  // Fetch user statistics from the API
  async function fetchUserStats() {
    try {
      console.log('Fetching user stats from:', `${serverUrl}/users/admin/stats`);
      console.log('User from session:', user);
      
      const response = await fetch(`${serverUrl}/users/admin/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.userId || '',
          'X-User-Role': user.role || ''
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Unauthorized access");
          window.location.href = "login.html";
          return null;
        }
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Received data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  // Fetch all users from the API
  async function fetchAllUsers(page = 1, search = '', status = '') {
    try {
      const queryParams = new URLSearchParams({
        page: page,
        limit: 10,
        search: search,
        status: status
      });

      console.log('Fetching users from:', `${serverUrl}/users/admin/all?${queryParams}`);
      
      const response = await fetch(`${serverUrl}/users/admin/all?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.userId || '',
          'X-User-Role': user.role || ''
        }
      });

      console.log('Users response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Unauthorized access");
          window.location.href = "login.html";
          return null;
        }
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Received users data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Load and display users in the table
  async function loadUsersTable(page = 1, search = '', status = '') {
    try {
      // Show loading state
      showLoadingTable();

      const usersData = await fetchAllUsers(page, search, status);
      if (usersData && usersData.users) {
        updateUsersTable(usersData.users);
        // Re-attach event listeners after table update
        attachSuspendEventListeners();
      }
    } catch (error) {
      console.error('Error loading users table:', error);
      showError('Failed to load users data');
      showEmptyTable();
    }
  }

  // Show loading state for the users table
  function showLoadingTable() {
    const tableBody = document.querySelector('#usersTable tbody');
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Loading users...</td></tr>';
    }
  }

  // Show empty table state
  function showEmptyTable() {
    const tableBody = document.querySelector('#usersTable tbody');
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No users found</td></tr>';
    }
  }

  // Update the users table with fetched data
  function updateUsersTable(users) {
    const tableBody = document.querySelector('#usersTable tbody');
    if (!tableBody) {
      console.warn('Table body not found');
      return;
    }

    // Clear existing rows
    tableBody.innerHTML = '';

    if (!users || users.length === 0) {
      showEmptyTable();
      return;
    }

    // Create rows for each user
    users.forEach(user => {
      const row = document.createElement('tr');
      row.setAttribute('data-status', user.status || 'active');
      row.setAttribute('data-plan', 'free'); // Default plan, adjust based on your data structure
      
      // Determine status badge class
      const status = user.status || 'active';
      const statusText = status.charAt(0).toUpperCase() + status.slice(1);
      
      row.innerHTML = `
        <td>${user.email || 'N/A'}</td>
        <td><span class="badge ${status}">${statusText}</span></td>
        <td>${user.sitesCount || 0}</td>
        <td>${user.lastLogin || 'Never'}</td>
        <td>
          <div class="dropdown">
            <button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              Select
            </button>
            <ul class="dropdown-menu">
              <li><a href="#"><img src="./images/edit_user.svg" alt="Edit" width="16" class="me-2" />Edit User</a></li>
              <li><a href="#"><img src="./images/view_logs.png" alt="Logs" width="16" class="me-2" />View Logs</a></li>
              <li><a href="#" class="suspend-user-link"><img src="./images/suspend_user.svg" alt="Suspend" width="16" class="me-2" />Suspend Account</a></li>
              <li><a href="#"><img src="./images/delete_user.svg" alt="Delete" width="16" class="me-2" />Delete User</a></li>
            </ul>
          </div>
        </td>
      `;
      
      tableBody.appendChild(row);
    });

    console.log(`Updated table with ${users.length} users`);
  }

  // Attach event listeners to suspend links
  function attachSuspendEventListeners() {
    const suspendLinks = document.querySelectorAll(".suspend-user-link");
    
    suspendLinks.forEach(link => {
      // Remove existing listener to avoid duplicates
      link.removeEventListener('click', handleSuspendClick);
      link.addEventListener('click', handleSuspendClick);
    });
  }

  // Handle suspend link clicks
  function handleSuspendClick(event) {
    event.preventDefault();
    const row = this.closest('tr');
    const emailCell = row.querySelector('td:first-child');
    const email = emailCell.textContent.trim();
    
    document.getElementById('suspendUserEmail').textContent = email;
    
    const modal = new bootstrap.Modal(document.getElementById('suspendUserModal'));
    modal.show();
  }

  // Load and display user statistics on the dashboard
  async function loadUserStats() {
    try {
      // Show loading state
      showLoadingCards();

      const stats = await fetchUserStats();
      if (stats) {
        updateDashboardCards(stats);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
      showError('Failed to load dashboard data');
    }
  }

  // Initial setup for suspend links (will be re-attached after table updates)
  attachSuspendEventListeners();

  // Add search functionality
  const searchInput = document.querySelector('.custom-search');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const searchTerm = this.value.trim();
        console.log('Searching for:', searchTerm);
        loadUsersTable(1, searchTerm);
      }, 300); // Debounce search
    });
  }


  // Show loading state for dashboard cards
  function showLoadingCards() {
    const cards = document.querySelectorAll('#admin-custom-cards .card-val');
    if (cards.length === 0) {
      console.warn('No card elements found');
      return;
    }
    cards.forEach(card => {
      card.textContent = '...';
      card.style.opacity = '0.5';
    });
  }

  // Update dashboard cards with fetched statistics
  function updateDashboardCards(stats) {
    if (!stats) return;

    // Get card elements - based on the HTML structure for user stats
    const registeredCard = document.querySelector('#admin-custom-cards .custom-card:first-child .card-val');
    const activeCard = document.querySelector('#admin-custom-cards .custom-card:nth-child(2) .card-val');
    const suspendedCard = document.querySelector('#admin-custom-cards .custom-card:nth-child(3) .card-val');

    // Update card values with proper formatting
    if (registeredCard) {
      registeredCard.textContent = formatNumber(stats.registered || 0);
      registeredCard.style.opacity = '1';
    }

    if (activeCard) {
      activeCard.textContent = formatNumber(stats.active || 0);
      activeCard.style.opacity = '1';
    }

    if (suspendedCard) {
      suspendedCard.textContent = formatNumber(stats.suspended || 0);
      suspendedCard.style.opacity = '1';
    }

    console.log('Dashboard updated with user stats:', stats);
  }

  // Format large numbers with K/M suffixes
  function formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  // Display error notification to user
  function showError(message) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-dismissible fade show';
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '20px';
    errorDiv.style.right = '20px';
    errorDiv.style.zIndex = '9999';
    errorDiv.style.maxWidth = '400px';

    errorDiv.innerHTML = `
      <strong>Error:</strong> ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(errorDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }

  // Handle logout
  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      sessionStorage.clear();
      window.location.href = 'login.html';
    });
  }
});


// Handles the suspend confirmation process - calculates end date and shows confirmation modal
document.getElementById("suspendBtn").addEventListener("click", function () {
  // Gets selected suspension duration and calculates end date
  const duration = document.querySelector('input[name="suspendDuration"]:checked').value;

  const today = new Date();
  today.setDate(today.getDate() + parseInt(duration));

  const formattedDate = today.toLocaleDateString('en-GB'); // dd/mm/yyyy

  document.getElementById("suspension-end-date").textContent = formattedDate;

  // Hides suspend modal and shows confirmation modal
  const suspendModal = bootstrap.Modal.getInstance(document.getElementById("suspendUserModal"));
  suspendModal.hide();

  const confirmModal = new bootstrap.Modal(document.getElementById("suspendConfirmationModal"));
  confirmModal.show();
});

// Initializes table filtering functionality for status and plan filters
document.addEventListener('DOMContentLoaded', function () {
  const statusFilter = document.getElementById('statusFilter');
  const planFilter = document.getElementById('PlanFilter');
  const rows = document.querySelectorAll('#user-table tbody tr');

  // Only add filtering if the elements exist
  if (statusFilter && planFilter && rows.length > 0) {
    // Filters table rows based on selected status and plan criteria
    function applyFilters() {
      const selectedStatus = statusFilter.value !== 'Status' ? statusFilter.value.toLowerCase() : null;
      const selectedPlan = planFilter.value !== 'Plan' ? planFilter.value.toLowerCase() : null;

      // Shows/hides rows based on filter matching
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

    // Adds event listeners to filter dropdowns
    statusFilter.addEventListener('change', applyFilters);
    planFilter.addEventListener('change', applyFilters);
  } else {
    console.log('Filter elements not found, skipping filter initialization');
  }
});