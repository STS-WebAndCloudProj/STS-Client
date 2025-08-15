// Initializes user management functionality
document.addEventListener("DOMContentLoaded", async () => {
  // const serverUrl = 'http://localhost:3000/api';
  const serverUrl = 'https://sts-server-cjv3.onrender.com/api';

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
          <section class="actions-container">
            <a href="#" data-bs-toggle="modal" data-bs-target="#editUserModal"><img src="./images/edit_user.svg" alt="Edit User" /></a>
            <a href="#" data-bs-toggle="modal" data-bs-target="#deleteUserModal"><img src="./images/delete_user.svg" alt="Delete User"/></a>
          </section>
        </td>
      `;
      
      tableBody.appendChild(row);
    });

    console.log(`Updated table with ${users.length} users`);
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
    showAlert(message, 'danger');
  }

  // Display success notification to user  
  function showSuccess(message) {
    showAlert(message, 'success');
  }

  // Display styled alert notification
  function showAlert(message, type) {
    // Create alert container if it doesn't exist
    let alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
      alertContainer = document.createElement('div');
      alertContainer.id = 'alertContainer';
      alertContainer.style.position = 'fixed';
      alertContainer.style.top = '20px';
      alertContainer.style.left = '50%';
      alertContainer.style.transform = 'translateX(-50%)';
      alertContainer.style.zIndex = '9999';
      alertContainer.style.maxWidth = '400px';
      alertContainer.style.width = '90%';
      document.body.appendChild(alertContainer);
    }
    
    const icon = type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill";
    alertContainer.innerHTML = `
      <div class="alert alert-${type} d-flex align-items-center shadow" role="alert">
        <i class="bi ${icon} flex-shrink-0 me-2" role="img" aria-label="${type}"></i>
        <div>${message}</div>
      </div>
    `;
    setTimeout(() => {
      alertContainer.innerHTML = "";
    }, 4000);
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

  // ================== NEW MODAL FUNCTIONALITY ==================

  // Handle Edit User Modal
  document.getElementById('editUserModal').addEventListener('show.bs.modal', function (event) {
    // Get the button that triggered the modal
    var button = event.relatedTarget;
    var row = button.closest('tr');
    
    // Store reference to the button for later use
    this._triggerButton = button;
    
    // Extract info from data attributes and table cells
    var email = row.cells[0].textContent;
    var status = row.getAttribute('data-status');
    
    // Update the modal's content
    document.getElementById('editUserEmail').textContent = email;
    document.getElementById('editUserName').textContent = email; // Using email as name for now
    document.getElementById('editUserStatus').value = status;
    
    // Show/hide options based on current status
    toggleStatusOptions(status);
  });

  // Handle status change in edit modal
  document.getElementById('editUserStatus').addEventListener('change', function() {
    var selectedStatus = this.value;
    toggleStatusOptions(selectedStatus);
  });

  // Function to show/hide status-specific options
  function toggleStatusOptions(status) {
    var suspensionOptions = document.getElementById('suspensionOptions');
    var disableOptions = document.getElementById('disableOptions');
    
    // Hide all options first
    suspensionOptions.style.display = 'none';
    disableOptions.style.display = 'none';
    
    // Show relevant options based on status
    if (status === 'suspended') {
      suspensionOptions.style.display = 'block';
    } else if (status === 'disabled') {
      disableOptions.style.display = 'block';
    }
  }

  // Handle disable reason dropdown change
  document.getElementById('editDisableReason').addEventListener('change', function() {
    var customTextarea = document.getElementById('editDisableReasonCustom');
    if (this.value === 'other') {
      customTextarea.style.display = 'block';
    } else {
      customTextarea.style.display = 'none';
    }
  });

  // Handle Delete User Modal
  document.getElementById('deleteUserModal').addEventListener('show.bs.modal', function (event) {
    // Get the button that triggered the modal
    var button = event.relatedTarget;
    var row = button.closest('tr');
    
    // Extract info from table cells
    var email = row.cells[0].textContent;
    
    // Update the modal's content
    document.getElementById('deleteUserEmail').textContent = email;
    document.getElementById('deleteUserName').textContent = email; // Using email as name for now
  });

  // Handle delete confirmation input
  document.getElementById('deleteConfirmation').addEventListener('input', function() {
    var deleteBtn = document.getElementById('deleteUserBtn');
    if (this.value === 'DELETE') {
      deleteBtn.disabled = false;
    } else {
      deleteBtn.disabled = true;
    }
  });

  // Handle save user changes
  document.getElementById('saveUserBtn').addEventListener('click', async function() {
    var selectedStatus = document.getElementById('editUserStatus').value;
    var message = 'User action completed successfully!';
    
    // Get the current modal trigger button and row
    var modal = document.getElementById('editUserModal');
    var button = modal._triggerButton;
    var row = button ? button.closest('tr') : null;
    
    if (!row) {
      showError('Could not identify user row');
      return;
    }

    // Get user email for API call
    var userEmail = row.cells[0].textContent.trim();
    
    // Prepare update data
    var updateData = {
      email: userEmail,
      status: selectedStatus
    };

    if (selectedStatus === 'suspended') {
      var duration = document.querySelector('input[name="suspendDuration"]:checked').value;
      var reason = document.getElementById('editSuspendReason').value;
      updateData.suspendDuration = duration;
      updateData.suspendReason = reason;
      message = `User suspended for ${duration} days.`;
      if (reason) {
        message += ` Reason: ${reason}`;
      }
    } else if (selectedStatus === 'disabled') {
      var disableReason = document.getElementById('editDisableReason').value;
      var customReason = document.getElementById('editDisableReasonCustom').value;
      updateData.disableReason = disableReason === 'other' ? customReason : disableReason;
      
      message = `User account disabled.`;
      if (updateData.disableReason) {
        message += ` Reason: ${updateData.disableReason.replace('_', ' ')}`;
      }
    } else if (selectedStatus === 'active') {
      message = 'User account activated successfully!';
    }
    
    try {
      // Show loading state
      this.disabled = true;
      this.textContent = 'Saving...';
      
      // Make API call to update user status
      const success = await updateUserStatus(updateData);
      
      if (success) {
        // Update the table row immediately
        updateRowStatus(row, selectedStatus);
        
        // Show success message
        showSuccess(message);
        
        // Close modal
        var modalInstance = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
        modalInstance.hide();
        
        // Reload stats to reflect changes
        await loadUserStats();
      } else {
        showError('Failed to update user status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      showError('Error updating user status. Please try again.');
    } finally {
      // Reset button state
      this.disabled = false;
      this.textContent = 'Save Changes';
    }
  });

  // Function to update user status via API
  async function updateUserStatus(updateData) {
    try {
      console.log('Updating user status:', JSON.stringify(updateData, null, 2));
      console.log('Admin user making request:', JSON.stringify(user, null, 2));
      console.log('Admin user details:', {
        userId: user.userId,
        email: user.email,
        role: user.role,
        status: user.status
      });
      
      // First, we need to get the user data from the email
      const targetUser = await findUserByEmail(updateData.email);
      if (!targetUser) {
        throw new Error('User not found');
      }
      
      console.log('Target user to update:', JSON.stringify(targetUser, null, 2));
      
      // Use the main admin route: PATCH /api/users/admin/:userId/status
      // Using same headers that work for stats and user list calls
      const requestHeaders = {
        'Content-Type': 'application/json',
        'user-id': user.userId || '',
        'X-User-Role': user.role || '',
        'admin-id': user._id || '' // Try adding MongoDB _id as admin-id
      };
      
      console.log('Request headers being sent (same as working calls):', JSON.stringify(requestHeaders, null, 2));
      
      const requestUrl = `${serverUrl}/users/admin/${targetUser.userId}/status`;
      const requestBody = { status: updateData.status };
      
      console.log('Request URL:', requestUrl);
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      console.log('Status being sent:', requestBody.status);
      console.log('Status type:', typeof requestBody.status);
      
      const response = await fetch(requestUrl, {
        method: 'PATCH',
        headers: requestHeaders,
        body: JSON.stringify(requestBody)
      });

      console.log('Update response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Unauthorized access");
          window.location.href = "login.html";
          return false;
        }
        if (response.status === 403) {
          console.error("Access denied. Check admin permissions.");
          // Let's also check if the admin user exists in the database
          console.log('Checking if admin user exists in database...');
          const adminCheck = await findUserByEmail(user.email);
          console.log('Admin user from database:', JSON.stringify(adminCheck, null, 2));
          console.log('Admin user details from DB:', {
            userId: adminCheck?.userId,
            email: adminCheck?.email,
            role: adminCheck?.role,
            status: adminCheck?.status
          });
          console.log('Session storage user:', JSON.stringify(user, null, 2));
          console.log('Headers sent to server:', JSON.stringify(requestHeaders, null, 2));
          console.log('Are userIds matching?', adminCheck?.userId === user.userId);
        }
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('Update result:', result);
      return result.message && result.message.includes('successfully');
    } catch (error) {
      console.error('Error in updateUserStatus:', error);
      throw error;
    }
  }

  // Helper function to find user by email (since your API uses userId)
  async function findUserByEmail(email) {
    try {
      // Use your existing search endpoint to find the user
      const response = await fetch(`${serverUrl}/users/admin/search?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.userId,
          'X-User-Role': user.role
        }
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const users = await response.json();
      return users.find(u => u.email.toLowerCase() === email.toLowerCase());
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  // Function to update a table row's status
  function updateRowStatus(row, newStatus) {
    // Update the data attribute
    row.setAttribute('data-status', newStatus);
    
    // Update the status badge
    var statusCell = row.cells[1]; // Second column is status
    var badge = statusCell.querySelector('.badge');
    if (badge) {
      // Remove old status classes
      badge.classList.remove('active', 'suspended', 'disabled');
      // Add new status class
      badge.classList.add(newStatus);
      // Update text
      badge.textContent = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
    }
  }

  // Handle delete user confirmation
  document.getElementById('deleteUserBtn').addEventListener('click', async function() {
    // Get user email from modal
    var userEmail = document.getElementById('deleteUserEmail').textContent.trim();
    
    try {
      // Show loading state
      this.disabled = true;
      this.textContent = 'Deleting...';
      
      // Make API call to delete user
      const success = await deleteUser(userEmail);
      
      if (success) {
        showSuccess('User deleted successfully!');
        
        // Close modal
        var modalInstance = bootstrap.Modal.getInstance(document.getElementById('deleteUserModal'));
        modalInstance.hide();
        
        // Reload the table and stats to reflect changes
        await loadUsersTable();
        await loadUserStats();
      } else {
        showError('Failed to delete user. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showError('Error deleting user. Please try again.');
    } finally {
      // Reset button state
      this.disabled = false;
      this.textContent = 'Delete User';
    }
  });

  // Function to delete user via API
  async function deleteUser(userEmail) {
    try {
      console.log('Deleting user:', userEmail);
      
      // First, we need to get the userId from the email
      const userData = await findUserByEmail(userEmail);
      if (!userData) {
        throw new Error('User not found');
      }
      
      // Use your existing endpoint: DELETE /api/users/admin/:userId
      const response = await fetch(`${serverUrl}/users/admin/${userData.userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.userId,
          'X-User-Role': user.role
        }
      });

      console.log('Delete response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Unauthorized access");
          window.location.href = "login.html";
          return false;
        }
        if (response.status === 403) {
          console.error("Access denied. Check admin permissions.");
          console.log('Current user:', user);
        }
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('Delete result:', result);
      return result.message && result.message.includes('successfully');
    } catch (error) {
      console.error('Error in deleteUser:', error);
      throw error;
    }
  }
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