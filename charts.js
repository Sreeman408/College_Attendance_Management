// charts.js - Chart wrappers for Annamalai University College Management System

(function (window) {
  const activeCharts = {};

  function destroyExisting(id) {
    if (activeCharts[id]) {
      activeCharts[id].destroy();
      delete activeCharts[id];
    }
  }

  const CollegeCharts = {
    // 1. Pie Chart: Overall Attendance Breakdown
    renderOverallPie: function (canvasId, present, late, absent) {
      destroyExisting(canvasId);

      const ctx = document.getElementById(canvasId);
      if (!ctx) return;

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const textColor = isDark ? '#94a3b8' : '#64748b';

      activeCharts[canvasId] = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Present Sessions', 'Late Sessions', 'Absent Sessions'],
          datasets: [{
            data: [present, late, absent],
            backgroundColor: [
              '#10b981', // green
              '#f59e0b', // amber
              '#ef4444'  // red
            ],
            borderWidth: isDark ? 2 : 1,
            borderColor: isDark ? '#151b26' : '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: textColor,
                font: { family: 'Inter', size: 12 },
                padding: 10
              }
            }
          }
        }
      });
    },

    // 2. Bar Chart: Course-wise Attendance Rates
    renderSubjectBars: function (canvasId, labels, values, threshold = 75) {
      destroyExisting(canvasId);

      const ctx = document.getElementById(canvasId);
      if (!ctx) return;

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const textColor = isDark ? '#94a3b8' : '#64748b';
      const gridColor = isDark ? '#273142' : '#e2e8f0';

      // Colors: Crimson below threshold, Green above
      const barColors = values.map(val => val >= threshold ? '#10b981' : '#800020');

      activeCharts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Attendance Rate (%)',
            data: values,
            backgroundColor: barColors,
            borderRadius: 6,
            barThickness: 28
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: textColor, font: { family: 'Inter', size: 11 } }
            },
            y: {
              min: 0,
              max: 100,
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: 'Inter', size: 11 } }
            }
          }
        }
      });
    }
  };

  window.CollegeCharts = CollegeCharts;
})(window);
