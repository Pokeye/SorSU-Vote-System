document.addEventListener('DOMContentLoaded', () => {
    // Data specific to the Freethinker Leaderboards (Placeholder Data)
    const freethinkerResultsData = [
        {
            position: "President (The Rationalist)",
            candidates: [
                { id: "chart-ft-president-aristotle", name: "Aristotle Cruz", votes: 88, percentage: "88%", color: "#a90000" } // Red bar
            ]
        },
        {
            position: "Vice President (The Skeptic)",
            candidates: [
                { id: "chart-ft-vp-socrates", name: "Socrates Reyes", votes: 40, percentage: "40%", color: "#ffc107" }, // Orange bar
                { id: "chart-ft-vp-plato", name: "Plato Garcia", votes: 60, percentage: "60%", color: "#ffc107" } // Orange bar
            ]
        },
        {
            position: "Secretary (Keeper of Logic)",
            candidates: [
                { id: "chart-ft-secretary-simone", name: "Simone De Beauvoir", votes: 75, percentage: "75%", color: "#a90000" } // Red bar
            ]
        },
        {
            position: "Treasurer (The Pragmatist)",
            candidates: [
                { id: "chart-ft-treasurer-noam", name: "Noam Chomsky", votes: 95, percentage: "95%", color: "#a90000" } // Red bar
            ]
        },
        {
            position: "Communications Officer",
            candidates: [
                { id: "chart-ft-comm-bertrand", name: "Bertrand Russell", votes: 70, percentage: "70%", color: "#a90000" }, // Red bar
                { id: "chart-ft-comm-ayn", name: "Ayn Rand", votes: 30, percentage: "30%", color: "#a90000" } // Red bar
            ]
        },
        {
            position: "Auditor (The Fact-Checker)",
            candidates: [
                { id: "chart-ft-auditor-carl", name: "Carl Sagan", votes: 100, percentage: "100%", color: "#a90000" } // Red bar
            ]
        }
    ];

    /**
     * Initializes the Chart.js horizontal bar chart and updates HTML names/percentages.
     */
    const createChart = (canvasId, percentage, color) => {
        const ctx = document.getElementById(canvasId);
        if (ctx) {
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: [''], 
                    datasets: [{
                        data: [percentage],
                        backgroundColor: color,
                        borderWidth: 0,
                        barPercentage: 1.0, 
                        categoryPercentage: 1.0
                    }]
                },
                options: {
                    indexAxis: 'y', 
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { display: false, beginAtZero: true, max: 100, },
                        y: { display: false }
                    },
                    plugins: { legend: { display: false }, tooltip: { enabled: false } },
                    layout: { padding: 0 },
                    elements: { bar: { borderRadius: 5 } }
                }
            });
        }
    };

    freethinkerResultsData.forEach(position => {
        position.candidates.forEach(candidate => {
            const canvasElement = document.getElementById(candidate.id);
            if (canvasElement) {
                const candidateItem = canvasElement.closest('.candidate-result-item');
                const headerRow = candidateItem.querySelector('.candidate-header-row');
                
                if (headerRow) {
                    const percentageLabel = document.createElement('p');
                    percentageLabel.className = 'percentage-label';
                    percentageLabel.textContent = candidate.percentage;
                    
                    const nameElement = candidateItem.querySelector('.candidate-name');
                    nameElement.textContent = candidate.name; 
                    headerRow.appendChild(percentageLabel);
                }
                createChart(candidate.id, candidate.votes, candidate.color);
            }
        });
    });
});