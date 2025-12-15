document.addEventListener('DOMContentLoaded', () => {
    // Data specific to the JPIA Leaderboards, derived from the image
    const jpiaResultsData = [
        {
            position: "President",
            candidates: [
                { id: "chart-jpia-president-samwise", name: "Samwise Gamgee", votes: 85, percentage: "85%", color: "#a90000" } // Adjusted to approximate bar length
            ]
        },
        {
            position: "Aragetay", // New position name from image
            candidates: [
                { id: "chart-jpia-aragetay-dipwasc", name: "Dipwasc", votes: 30, percentage: "30%", color: "#a90000" }, // Yellow bar from image
                { id: "chart-jpia-aragetay-somawlho", name: "Somawlho ry GS-Grwagj", votes: 40, percentage: "40%", color: "#a90000" }, // Yellow bar from image
                { id: "chart-jpia-aragetay-morisette", name: "Morisette Amon", votes: 30, percentage: "30%", color: "#a90000" }  // Yellow bar from image
            ]
        },
        {
            position: "Secacadier", // New position name from image
            candidates: [
                { id: "chart-jpia-secacadier-bilbo", name: "Bilbo Baggins", votes: 70, percentage: "70%", color: "#a90000" } // Adjusted to approximate bar length
            ]
        },
        {
            position: "Pippin", // New position name from image
            candidates: [
                { id: "chart-jpia-pippin-dipwasc", name: "Dipwasc", votes: 20, percentage: "20%", color: "#a90000" }, // Yellow bar from image
                { id: "chart-jpia-pippin-tsowgagot", name: "Tsowgagot", votes: 50, percentage: "50%", color: "#a90000" }, // Yellow bar from image
                { id: "chart-jpia-pippin-morisette", name: "Morisette Amon", votes: 30, percentage: "30%", color: "#a90000" } // Yellow bar from image
            ]
        },
        {
            position: "Fingerton Title", // New position name from image
            candidates: [
                { id: "chart-jpia-fingerton-frodo", name: "Frodo Took", votes: 90, percentage: "90%", color: "#a90000" } // Adjusted to approximate bar length
            ]
        },
        {
            position: "PIO",
            candidates: [
                { id: "chart-jpia-pio-treebreebeard", name: "Treebreebeard", votes: 65, percentage: "65%", color: "#a90000" } // Adjusted to approximate bar length
            ]
        },
        {
            position: "Business Manager",
            candidates: [
                { id: "chart-jpia-bm-canadiel", name: "Canadiel Lothlórien", votes: 75, percentage: "75%", color: "#a90000" } // Adjusted to approximate bar length
            ]
        }
    ];

    /**
     * Initializes the Chart.js horizontal bar chart for a single candidate.
     * @param {string} canvasId - The ID of the canvas element.
     * @param {number} percentage - The percentage value for the bar (0-100).
     * @param {string} color - The color of the bar.
     */
    const createChart = (canvasId, percentage, color) => {
        const ctx = document.getElementById(canvasId);
        if (ctx) {
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: [''], // Single label to represent the bar
                    datasets: [{
                        data: [percentage],
                        backgroundColor: color,
                        borderWidth: 0,
                        barPercentage: 1.0, 
                        categoryPercentage: 1.0
                    }]
                },
                options: {
                    indexAxis: 'y', // Makes it a horizontal bar chart
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            display: false, // Hide x-axis labels and ticks
                            beginAtZero: true,
                            max: 100, // Max scale is 100%
                        },
                        y: {
                            display: false // Hide y-axis labels and ticks
                        }
                    },
                    plugins: {
                        legend: {
                            display: false // Hide the legend
                        },
                        tooltip: {
                            enabled: false // Hide tooltips on hover
                        }
                    },
                    layout: {
                        padding: 0
                    },
                    elements: {
                        bar: {
                            borderRadius: 5 // Rounded bar ends
                        }
                    }
                }
            });
        }
    };

    /**
     * Inserts the percentage text into the candidate header row and initializes the chart.
     */
    jpiaResultsData.forEach(position => {
        position.candidates.forEach(candidate => {
            // 1. Insert the percentage label into the HTML
            const canvasElement = document.getElementById(candidate.id);
            if (canvasElement) {
                const candidateItem = canvasElement.closest('.candidate-result-item');
                const headerRow = candidateItem.querySelector('.candidate-header-row');
                
                if (headerRow) {
                    // Create the percentage label element
                    const percentageLabel = document.createElement('p');
                    percentageLabel.className = 'percentage-label';
                    percentageLabel.textContent = candidate.percentage;
                    
                    // Append it to the header row
                    headerRow.appendChild(percentageLabel);
                }

                // 2. Initialize the Chart.js bar
                createChart(candidate.id, candidate.votes, candidate.color);
            }
        });
    });
});