document.addEventListener('DOMContentLoaded', () => {
    // Data specific to the Book Club Leaderboards (Placeholder Data)
    const bookclubResultsData = [
        {
            position: "President (The Literary Critic)",
            candidates: [
                { id: "chart-bc-president-jane", name: "Jane Austen", votes: 90, percentage: "90%", color: "#a90000" } // Red bar
            ]
        },
        {
            position: "Vice President (The Storyteller)",
            candidates: [
                { id: "chart-bc-vp-gabriel", name: "Gabriel Garcia Marquez", votes: 65, percentage: "65%", color: "#a90000" }, // Orange bar
                { id: "chart-bc-vp-virginia", name: "Virginia Woolf", votes: 35, percentage: "35%", color: "#a90000" } // Orange bar
            ]
        },
        {
            position: "Secretary (The Note-Taker)",
            candidates: [
                { id: "chart-bc-secretary-tolkien", name: "J.R.R. Tolkien", votes: 80, percentage: "80%", color: "#a90000" } // Red bar
            ]
        },
        {
            position: "Treasurer (The Fund Raiser)",
            candidates: [
                { id: "chart-bc-treasurer-fitzgerald", name: "F. Scott Fitzgerald", votes: 75, percentage: "75%", color: "#a90000" } // Red bar
            ]
        },
        {
            position: "Events Coordinator",
            candidates: [
                { id: "chart-bc-events-hemingway", name: "Ernest Hemingway", votes: 52, percentage: "52%", color: "#a90000" }, // Orange bar
                { id: "chart-bc-events-harper", name: "Harper Lee", votes: 48, percentage: "48%", color: "#a90000" } // Orange bar
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

    bookclubResultsData.forEach(position => {
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