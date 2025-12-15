document.addEventListener('DOMContentLoaded', () => {
    // Define the candidate data and results based on the image provided
    const resultsData = [
        {
            position: "President",
            candidates: [
                { id: "chart-president-maria", name: "Maria Labo", votes: 71, percentage: "71%", color: "#a90000" },
                { id: "chart-president-juan", name: "Juan Linaw", votes: 4, percentage: "4%", color: "#a90000" }
            ]
        },
        {
            position: "Vice President",
            candidates: [
                { id: "chart-vp-luxe", name: "Luxe Organix", votes: 83, percentage: "83%", color: "#a90000" },
                { id: "chart-vp-unilab", name: "Unilab Celeteque", votes: 17, percentage: "17%", color: "#a90000" }
            ]
        },
        {
            position: "Secretary",
            candidates: [
                { id: "chart-secretary-sam", name: "Sam Mangubat", votes: 23, percentage: "23%", color: "#a90000" },
                { id: "chart-secretary-morisette", name: "Morisette Amon", votes: 60, percentage: "60%", color: "#a90000" },
                { id: "chart-secretary-regine", name: "Regine Velasquez", votes: 17, percentage: "17%", color: "#a90000" }
            ]
        },
        {
            position: "Treasurer",
            candidates: [
                { id: "chart-treasurer-sabrina", name: "Sabrina Carpenter", votes: 100, percentage: "100%", color: "#a90000" }
            ]
        },
        {
            position: "Auditor",
            candidates: [
                { id: "chart-auditor-luxe", name: "Luxe Organix", votes: 83, percentage: "83%", color: "#a90000" },
                { id: "chart-auditor-unilab", name: "Unilab Celeteque", votes: 17, percentage: "17%", color: "#a90000" }
            ]
        },
        {
            position: "PIO",
            candidates: [
                { id: "chart-pio-sam", name: "Sam Mangubat", votes: 23, percentage: "23%", color: "#a90000" },
                { id: "chart-pio-morisette", name: "Morisette Amon", votes: 60, percentage: "60%", color: "#a90000" },
                { id: "chart-pio-regine", name: "Regine Velasquez", votes: 17, percentage: "17%", color: "#a90000" }
            ]
        },
        {
            position: "Business Manager",
            candidates: [
                { id: "chart-bm-luxe", name: "Luxe Organix", votes: 83, percentage: "83%", color: "#a90000" },
                { id: "chart-bm-unilab", name: "Unilab Celeteque", votes: 17, percentage: "17%", color: "#a90000" }
            ]
        },
        {
            position: "Escort",
            candidates: [
                { id: "chart-escort-harry", name: "Harry Styles", votes: 100, percentage: "100%", color: "#a90000" }
            ]
        },
        {
            position: "Muse",
            candidates: [
                { id: "chart-muse-lea", name: "Lea Salonga", votes: 23, percentage: "23%", color: "#a90000" },
                { id: "chart-muse-morisette", name: "Morisette Amon", votes: 60, percentage: "60%", color: "#a90000" },
                { id: "chart-muse-regine", name: "Regine Velasquez", votes: 17, percentage: "17%", color: "#a90000" }
            ]
        },
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
                        x: {
                            display: false, 
                            beginAtZero: true,
                            max: 100, 
                        },
                        y: {
                            display: false 
                        }
                    },
                    plugins: {
                        legend: {
                            display: false 
                        },
                        tooltip: {
                            enabled: false 
                        }
                    },
                    layout: {
                        padding: 0
                    },
                    elements: {
                        bar: {
                            borderRadius: 5 
                        }
                    }
                }
            });
        }
    };

    /**
     * Inserts the percentage text into the candidate header row and initializes the chart.
     */
    resultsData.forEach(position => {
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