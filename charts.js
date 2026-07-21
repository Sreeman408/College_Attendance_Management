// charts.js - Advanced Chart wrappers for Annamalai University College Management System

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
    renderOverallPie: function (canvasId, present, late, absent, excused = 0) {
      destroyExisting(canvasId);

      const ctx = document.getElementById(canvasId);
      if (!ctx) return;

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const textColor = isDark ? '#cbd5e1' : '#64748b';

      activeCharts[canvasId] = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Present Sessions', 'Late Sessions', 'Absent Sessions', 'Excused Leaves'],
          datasets: [{
            data: [present, late, absent, excused],
            backgroundColor: [
              '#10b981', // green
              '#f59e0b', // amber
              '#ef4444', // red
              '#3b82f6'  // blue
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
      const textColor = isDark ? '#cbd5e1' : '#64748b';
      const gridColor = isDark ? '#273142' : '#e2e8f0';

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
    },

    // 3. Department Comparative Analytics Bar Chart (Admin)
    renderDeptComparisonBars: function (canvasId, deptLabels, avgValues) {
      destroyExisting(canvasId);

      const ctx = document.getElementById(canvasId);
      if (!ctx) return;

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const textColor = isDark ? '#cbd5e1' : '#64748b';
      const gridColor = isDark ? '#273142' : '#e2e8f0';

      activeCharts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: deptLabels,
          datasets: [{
            label: 'Avg Attendance %',
            data: avgValues,
            backgroundColor: ['#800020', '#d4af37', '#2563eb'],
            borderRadius: 8,
            barThickness: 36
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor, font: { family: 'Inter', size: 11 } } },
            y: { min: 0, max: 100, grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Inter', size: 11 } } }
          }
        }
      });
    },

    // 4. Predictive Attendance Trajectory Line Chart (Student Dashboard)
    renderPredictiveLine: function (canvasId, dates, actualPctSeries, predictedPctSeries) {
      destroyExisting(canvasId);

      const ctx = document.getElementById(canvasId);
      if (!ctx) return;

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const textColor = isDark ? '#cbd5e1' : '#64748b';
      const gridColor = isDark ? '#273142' : '#e2e8f0';

      activeCharts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: dates,
          datasets: [
            {
              label: 'Actual Attendance %',
              data: actualPctSeries,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fill: true,
              tension: 0.3
            },
            {
              label: 'ML Projected Trajectory %',
              data: predictedPctSeries,
              borderColor: '#f59e0b',
              borderDash: [5, 5],
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { color: textColor, font: { family: 'Inter', size: 11 } }
            }
          },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Inter', size: 10 } } },
            y: { min: 0, max: 100, grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Inter', size: 10 } } }
          }
        }
      });
    }
  };

  window.CollegeCharts = CollegeCharts;

})(window);
