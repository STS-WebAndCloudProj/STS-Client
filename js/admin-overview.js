// Scan Activity Bar Chart
const ctx = document.getElementById('scanChart').getContext('2d');
new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [{
      label: 'Scan Activity',
      data: [82, 101, 87, 64, 72, 80, 89],
      backgroundColor: [
        '#0c2b56', '#0c2b56', '#0c2b56',
        '#0c2b56', '#0c2b56', '#ffdb99', '#0c2b56'
      ],
      borderRadius: 6,
      barThickness: 35
    }]
  },
  options: {
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
      }
    }
  }
});

// Vulnerability Types Pie Chart
const vulnCtx = document.getElementById('vulnChart').getContext('2d');
new Chart(vulnCtx, {
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
    plugins: {
      legend: {
        display: false
      }
    }
  }
});
