document.addEventListener('DOMContentLoaded', () => {
    // Data specific to the RCYC Leaderboards, updated with Filipino Content Creator names
    const rcycResultsData = [
        {
            position: "Vice President",
            candidates: [
                { id: "chart-rcyc-vp-ganuman", name: "Zeinab Harake", votes: 80, percentage: "80%", color: "#a90000" } 
            ]
        },
        {
            position: "Secretary",
            candidates: [
                { id: "chart-rcyc-secretary-lipowshc", name: "Zack Tabudlo", votes: 35, percentage: "35%", color: "#a90000" }, 
                { id: "chart-rcyc-secretary-sswarwhorpl", name: "Moira Dela Torre", votes: 65, percentage: "65%", color: "#a90000" } 
            ]
        },
        {
            position: "Vice President 2", 
            candidates: [
                { id: "chart-rcyc-vp2-argom", name: "Niana Guerrero", votes: 90, percentage: "90%", color: "#a90000" } 
            ]
        },
        {
            position: "PIO",
            candidates: [
                { id: "chart-rcyc-pio-moqn", name: "Chef RV Manabat", votes: 100, percentage: "100%", color: "#a90000" } 
            ]
        },
        {
            position: "Treasurer",
            candidates: [
                { id: "chart-rcyc-treasurer-bilbo", name: "Rixx Mirasol", votes: 75, percentage: "75%", color: "#a90000" } 
            ]
        },
        {
            position: "Business Manager",
            candidates: [
                { id: "chart-rcyc-bm-elodmel", name: "Bret Maverick", votes: 60, percentage: "60%", color: "#a90000" } 
            ]
        },
        {
            position: "Auditor",
            candidates: [
                { id: "chart-rcyc-auditor-galadriel", name: "Maymay Entrata", votes: 85, percentage: "85%", color: "#a90000" } 
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

    rcycResultsData.forEach(position => {
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
                    // This line overwrites the placeholder name in the HTML
                    nameElement.textContent = candidate.name; 
                    headerRow.appendChild(percentageLabel);
                }
                createChart(candidate.id, candidate.votes, candidate.color);
            }
        });
    });
});