document.addEventListener('DOMContentLoaded', () => {
    // Data specific to the Arts and Dance Leaderboards (Placeholder Data)
    const artsDanceResultsData = [
        {
            position: "President",
            candidates: [
                { id: "chart-ad-president-arturo", name: "Arturo Dela Cruz", votes: 65, percentage: "65%", color: "#a90000" } // Red bar
            ]
        },
        {
            position: "Vice President for Dance",
            candidates: [
                { id: "chart-ad-vpdance-vicki", name: "Vicki Belo", votes: 88, percentage: "88%", color: "#a90000" } // Red bar
            ]
        },
        {
            position: "VP for Culture & Arts",
            candidates: [
                { id: "chart-ad-vpculture-aga", name: "Aga Muhlach", votes: 72, percentage: "72%", color: "#a90000" } // Red bar
            ]
        },
        {
            position: "Secretary",
            candidates: [
                { id: "chart-ad-secretary-sarah", name: "Sarah G.", votes: 45, percentage: "45%", color: "#ffc107" }, // Orange bar
                { id: "chart-ad-secretary-bamboo", name: "Bamboo Manalac", votes: 55, percentage: "55%", color: "#ffc107" } // Orange bar
            ]
        },
        {
            position: "Treasurer",
            candidates: [
                { id: "chart-ad-treasurer-kathryn", name: "Kathryn Bernardo", votes: 95, percentage: "95%", color: "#a90000" } // Red bar
            ]
        },
        {
            position: "Communications Officer",
            candidates: [
                { id: "chart-ad-comm-daniel", name: "Daniel Padilla", votes: 78, percentage: "78%", color: "#a90000" } // Red bar
            ]
        },
        {
            position: "Muse",
            candidates: [
                { id: "chart-ad-muse-liza", name: "Liza Soberano", votes: 100, percentage: "100%", color: "#a90000" } // Red bar
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

    artsDanceResultsData.forEach(position => {
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