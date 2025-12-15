document.addEventListener('DOMContentLoaded', () => {
    // Data specific to the NSTP Leaderboards (Placeholder Data)
    const nstpResultsData = [
        {
            position: "Head Commander",
            candidates: [
                { id: "chart-nstp-commander-benitez", name: "Sgt. Maj. Benitez", votes: 75, percentage: "75%", color: "#a90000" } // Red bar
            ]
        },
        {
            position: "Vice Commander (LTS)",
            candidates: [
                { id: "chart-nstp-vclts-luzon", name: "Luzon P. Dela Cruz", votes: 80, percentage: "80%", color: "#a90000" } // Red bar
            ]
        },
        {
            position: "Vice Commander (CWTS)",
            candidates: [
                { id: "chart-nstp-vccwts-visayas", name: "Visayas S. De Leon", votes: 85, percentage: "85%", color: "#a90000" } // Red bar
            ]
        },
        {
            position: "Adjutant/Secretary",
            candidates: [
                { id: "chart-nstp-adjutant-mindanao", name: "Mindanao T. Lopez", votes: 60, percentage: "60%", color: "#a90000" } // Red bar
            ]
        },
        {
            position: "Treasurer",
            candidates: [
                { id: "chart-nstp-treasurer-juan", name: "PFC Juan Luna", votes: 40, percentage: "40%", color: "#ffc107" } // Orange bar
            ]
        },
        {
            position: "Public Information Officer",
            candidates: [
                { id: "chart-nstp-pio-emilio", name: "Cdt. Officer Emilio", votes: 55, percentage: "55%", color: "#ffc107" } // Orange bar
            ]
        },
        {
            position: "Muse",
            candidates: [
                { id: "chart-nstp-muse-heneral", name: "Cdt. Lt. Heneral Luna", votes: 90, percentage: "90%", color: "#a90000" } // Red bar
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

    nstpResultsData.forEach(position => {
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