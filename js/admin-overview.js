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

  // Fetch and display scan statistics
  await loadScanStats();
  await loadScanActivity();
  await loadVulnerabilityTypes(); // Added this line

  // Fetch scan statistics from the server API
  async function fetchScanStats() {
    try {
        console.log('Fetching scan stats from:', `${serverUrl}/scans/admin/stats`);
        console.log('User from session:', user);
        
        // Real API call - now using correct server authentication
        const response = await fetch(`${serverUrl}/scans/admin/stats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'user-id': user.userId || user._id || '',
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
        return data.stats;
    } catch (error) {
        console.error('Error fetching scan statistics:', error);
        showError('Failed to load scan statistics: ' + error.message);
        return null;
    }
  }

  // Load and display scan statistics on the dashboard
  async function loadScanStats() {
    try {
      // Show loading state
      showLoadingCards();
      
      const stats = await fetchScanStats();
      if (stats) {
        updateDashboardCards(stats);
      }
    } catch (error) {
      console.error('Error loading scan stats:', error);
      showError('Failed to load dashboard data');
    }
  }

  // Fetch weekly scan activity data from the server
  async function fetchScanActivity() {
    try {
        console.log('Fetching scan activity from:', `${serverUrl}/scans/admin/activity/weekly`);
        console.log('Using headers:', {
            'Content-Type': 'application/json',
            'user-id': user.userId || user._id || '',
            'X-User-Role': user.role || ''
        });
        
        const response = await fetch(`${serverUrl}/scans/admin/activity/weekly`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'user-id': user.userId || user._id || '',
                'X-User-Role': user.role || ''
            }
        });

        console.log('Scan activity response status:', response.status);
        console.log('Scan activity response ok:', response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Scan activity error response:', errorText);
            console.warn('Scan activity endpoint not available, using mock data');
            // Return mock data if endpoint doesn't exist yet
            return {
                dailyActivity: [82, 101, 87, 64, 72, 80, 89],
                labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            };
        }

        const data = await response.json();
        console.log('Received scan activity data:', data);
        
        // Handle the server response format
        if (data.message && data.dailyActivity && data.labels) {
            return {
                dailyActivity: data.dailyActivity,
                labels: data.labels
            };
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching scan activity:', error);
        console.warn('Using mock data due to error');
        // Fallback to mock data if there's an error
        return {
            dailyActivity: [82, 101, 87, 64, 72, 80, 89],
            labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        };
    }
  }

  // Load scan activity data and update the chart
  async function loadScanActivity() {
    try {
      const activityData = await fetchScanActivity();
      if (activityData) {
        updateScanActivityChart(activityData);
      }
    } catch (error) {
      console.error('Error loading scan activity:', error);
      // Initialize with default data if there's an error
      initializeCharts();
    }
  }

  // Fetch vulnerability types data from the server (NEW FUNCTION)
  async function fetchVulnerabilityTypes() {
    try {
        console.log('Fetching vulnerability types from:', `${serverUrl}/scans/admin/vulnerability-types`);
        
        const response = await fetch(`${serverUrl}/scans/admin/vulnerability-types`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'user-id': user.userId || user._id || '',
                'X-User-Role': user.role || ''
            }
        });

        console.log('Vulnerability types response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Vulnerability types error response:', errorText);
            console.warn('Vulnerability types endpoint not available, using mock data');
            // Return mock data if endpoint doesn't exist yet
            return {
                labels: ['Cross-site Scripting', 'SQL Injection', 'CSRF', 'Broken Authentication', 'Other'],
                data: [28, 22, 18, 17, 15],
                colors: ['#f16b7a', '#f8ab59', '#fbe078', '#89c791', '#62a3d3']
            };
        }

        const responseData = await response.json();
        console.log('Received vulnerability types data:', responseData);
        
        // Handle the server response format
        if (responseData.chartData) {
            return responseData.chartData;
        }
        
        return responseData;
    } catch (error) {
        console.error('Error fetching vulnerability types:', error);
        console.warn('Using mock data due to error');
        // Fallback to mock data if there's an error
        return {
            labels: ['Cross-site Scripting', 'SQL Injection', 'CSRF', 'Broken Authentication', 'Other'],
            data: [28, 22, 18, 17, 15],
            colors: ['#f16b7a', '#f8ab59', '#fbe078', '#89c791', '#62a3d3']
        };
    }
  }

  // Load vulnerability types data and update the pie chart (NEW FUNCTION)
  async function loadVulnerabilityTypes() {
    try {
      const vulnData = await fetchVulnerabilityTypes();
      if (vulnData) {
        updateVulnerabilityChart(vulnData);
      }
    } catch (error) {
      console.error('Error loading vulnerability types:', error);
      // Initialize with default data if there's an error
      initializeCharts();
    }
  }

  // Show loading state for dashboard cards
  function showLoadingCards() {
    const cards = document.querySelectorAll('#admin-custom-cards .card-val');
    cards.forEach(card => {
      card.textContent = '...';
      card.style.opacity = '0.5';
    });
  }

  // Update dashboard cards with fetched statistics
  function updateDashboardCards(stats) {
    if (!stats) return;

    // Get card elements
    const totalScansCard = document.querySelector('#admin-custom-cards .custom-card:first-child .card-val');
    const criticalCard = document.querySelector('#admin-custom-cards .custom-card:nth-child(2) .card-val');
    const pendingCard = document.querySelector('#admin-custom-cards .custom-card:nth-child(3) .card-val');

    // Update card values with proper formatting
    if (totalScansCard) {
      totalScansCard.textContent = formatNumber(stats.totalScans);
      totalScansCard.style.opacity = '1';
    }
    
    if (criticalCard) {
      criticalCard.textContent = formatNumber(stats.criticalScans);
      criticalCard.style.opacity = '1';
    }
    
    if (pendingCard) {
      pendingCard.textContent = formatNumber(stats.byStatus.pending);
      pendingCard.style.opacity = '1';
    }

    console.log('Dashboard updated with stats:', stats);
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

// Store chart instances for updating
let scanActivityChart = null;
let vulnerabilityChart = null;

// Update scan activity chart with real data
function updateScanActivityChart(activityData) {
  if (scanActivityChart) {
    // Update existing chart
    scanActivityChart.data.datasets[0].data = activityData.dailyActivity;
    scanActivityChart.data.labels = activityData.labels;
    
    // Update colors to highlight current day
    const colors = generateBarColors(activityData.labels);
    scanActivityChart.data.datasets[0].backgroundColor = colors;
    
    // Ensure tooltip configuration is preserved
    scanActivityChart.options.plugins.tooltip = {
      enabled: true,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: 'white',
      bodyColor: 'white',
      borderColor: '#ffdb99',
      borderWidth: 1,
      cornerRadius: 6,
      displayColors: false,
      callbacks: {
        title: function(context) {
          return context[0].label;
        },
        label: function(context) {
          return `Scans: ${context.parsed.y}`;
        }
      }
    };
    
    scanActivityChart.update('active');
    console.log('Scan activity chart updated with real data and tooltip config');
  } else {
    // Initialize chart if it doesn't exist
    initializeCharts();
  }
}

// Update vulnerability chart with real data (NEW FUNCTION)
function updateVulnerabilityChart(vulnData) {
  if (vulnerabilityChart) {
    // Update existing chart
    vulnerabilityChart.data.labels = vulnData.labels;
    vulnerabilityChart.data.datasets[0].data = vulnData.data;
    vulnerabilityChart.data.datasets[0].backgroundColor = vulnData.colors;
    
    // Update tooltip configuration
    vulnerabilityChart.options.plugins.tooltip = {
      enabled: true,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: 'white',
      bodyColor: 'white',
      borderColor: '#ffdb99',
      borderWidth: 1,
      cornerRadius: 6,
      displayColors: true,
      callbacks: {
        title: function(context) {
          return context[0].label;
        },
        label: function(context) {
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((context.parsed / total) * 100).toFixed(1);
          return `${context.parsed} threats (${percentage}%)`;
        }
      }
    };
    
    vulnerabilityChart.update('active');
    console.log('Vulnerability chart updated with real data');
  } else {
    // Initialize chart if it doesn't exist
    initializeCharts();
  }
}

// Generate bar colors with current day highlighted in yellow
function generateBarColors(labels) {
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDay = dayNames[today.getDay()];
  console.log('Current day:', currentDay, 'Labels:', labels);
  
  return labels.map(label => 
    label === currentDay ? '#ffdb99' : '#0c2b56'
  );
}

// Initialize both bar and pie charts with default configurations
function initializeCharts() {
  // Scan Activity Bar Chart
  const ctx = document.getElementById('scanChart');
  if (ctx && !scanActivityChart) {
    console.log('Initializing scan activity chart...');
    const initialLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const initialColors = generateBarColors(initialLabels);
    
    scanActivityChart = new Chart(ctx.getContext('2d'), {
      type: 'bar',
      data: {
        labels: initialLabels,
        datasets: [{
          label: 'Scan Activity',
          data: [82, 101, 87, 64, 72, 80, 89],
          backgroundColor: initialColors,
          borderRadius: 6,
          barThickness: 35,
          hoverBackgroundColor: initialColors.map(color => 
            color === '#ffdb99' ? '#ffd56b' : '#1e3a5f'
          )
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        scales: {
          x: {
            ticks: {
              autoSkip: false,
              maxRotation: 0,
              minRotation: 0,
              font: {
                size: 12
              }
            }
          },
          y: {
            beginAtZero: true,
            max: 110,
            ticks: {
              stepSize: 20
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: '#ffdb99',
            borderWidth: 1,
            cornerRadius: 6,
            displayColors: false,
            callbacks: {
              title: function(context) {
                return context[0].label;
              },
              label: function(context) {
                return `Scans: ${context.parsed.y}`;
              }
            }
          }
        }
      }
    });
    
    console.log('Scan activity chart initialized successfully');
  }

  // Vulnerability Types Pie Chart
  const vulnCtx = document.getElementById('vulnChart');
  if (vulnCtx && !vulnerabilityChart) {
    vulnerabilityChart = new Chart(vulnCtx.getContext('2d'), {
      type: 'pie',
      data: {
        labels: [
          'Cross-site Scripting',
          'SQL Injection',
          'CSRF',
          'Broken Authentication',
          'Other'
        ],
        datasets: [{
          data: [28, 22, 18, 17, 15],
          backgroundColor: [
            '#f16b7a', '#f8ab59', '#fbe078', '#89c791', '#62a3d3'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: '#ffdb99',
            borderWidth: 1,
            cornerRadius: 6,
            displayColors: true,
            callbacks: {
              title: function(context) {
                return context[0].label;
              },
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.parsed} vulnerabilities (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }
}

// Initialize charts after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure all elements are properly rendered
  setTimeout(initializeCharts, 100);
});