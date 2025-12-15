document.addEventListener('DOMContentLoaded', () => {
    // Data specific to the SSC Leaderboards (Placeholder Data)
    const sscResultsData = [
        {
            position: "President",
            candidates: [
                { id: "chart-ssc-president-pia", name: "Pia Alonzo Wurtzbach", votes: 92, percentage: "92%", color: "#a90000" } // Red bar
            ]
        },
        {
            position: "Vice President",
            candidates: [
                { id: "chart-ssc-vp-catriona", name: "Catriona Gray", votes: 85, percentage: "85%", color: "#a90000" } // Red bar
            ]
        },
        {
            position: "Secretary General",
            candidates: [
                { id: "chart-ssc-secretary-hillary", name: "Hillary P. Clinton", votes: 55, percentage: "55%", color: "#ffc107" }, // Orange bar
                { id: "chart-ssc-secretary-barack", name: "Barack H. Obama", votes: 45, percentage: "45%", color: "#ffc107" } // Orange bar
            ]
        },
        {
            position: "Treasurer",
            candidates: [
                { id: "chart-ssc-treasurer-queen", name: "Queen Elizabeth II", votes: 78, percentage: "78%", color: "#a90000" } // Red bar
            ]
        },
        {
            position: "Auditor",
            candidates: [
                { id: "chart-ssc-auditor-king", name: "King Charles III", votes: 65, percentage: "65%", color: "#a90000" }, // Red bar
                { id: "chart-ssc-auditor-prince", name: "Prince William", votes: 35, percentage: "35%", color: "#a90000" } // Red bar
            ]
        },
        {
            position: "Public Information Officer",
            candidates: [
                { id: "chart-ssc-pio-meghan", name: "Meghan Markle", votes: 100, percentage: "100%", color: "#a90000" } // Red bar
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

    sscResultsData.forEach(position => {
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