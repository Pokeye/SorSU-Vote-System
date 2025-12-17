document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_HOST = location.hostname === "127.0.0.1" ? "127.0.0.1" : "localhost";
    const API_BASE = location.protocol === "file:" || location.port === "5500" ? `http://${BACKEND_HOST}:3000` : "";
    const apiUrl = (p) => `${API_BASE}${p}`;

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

    const createChart = (canvasEl, percentage, color) => {
        if (canvasEl) {
            new Chart(canvasEl, {
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
    function renderExistingPlaceholders() {
        resultsData.forEach(position => {
            position.candidates.forEach(candidate => {
                const canvasElement = document.getElementById(candidate.id);
                if (!canvasElement) return;

                const candidateItem = canvasElement.closest('.candidate-result-item');
                const headerRow = candidateItem ? candidateItem.querySelector('.candidate-header-row') : null;

                if (headerRow) {
                    const percentageLabel = document.createElement('p');
                    percentageLabel.className = 'percentage-label';
                    percentageLabel.textContent = candidate.percentage;
                    headerRow.appendChild(percentageLabel);
                }

                createChart(canvasElement, candidate.votes, candidate.color);
            });
        });
    }

    function renderBackendResults(results) {
        const container = document.getElementById('resultsContainer');
        if (!container) return;
        container.innerHTML = '';

        results.forEach((pos, posIndex) => {
            const card = document.createElement('div');
            card.className = 'results-card';

            const title = document.createElement('h2');
            title.className = 'position-title';
            title.textContent = pos.position;
            card.appendChild(title);

            (pos.candidates || []).forEach((cand, candIndex) => {
                const item = document.createElement('div');
                item.className = 'candidate-result-item';

                const headerRow = document.createElement('div');
                headerRow.className = 'candidate-header-row';

                const nameEl = document.createElement('p');
                nameEl.className = 'candidate-name';
                nameEl.textContent = cand.name;
                headerRow.appendChild(nameEl);

                const percentageLabel = document.createElement('p');
                percentageLabel.className = 'percentage-label';
                percentageLabel.textContent = cand.percentage || '0%';
                headerRow.appendChild(percentageLabel);
                item.appendChild(headerRow);

                const partyEl = document.createElement('p');
                partyEl.className = 'candidate-party';
                partyEl.textContent = cand.party || '';
                item.appendChild(partyEl);

                const chartWrapper = document.createElement('div');
                chartWrapper.className = 'chart-wrapper';
                const canvas = document.createElement('canvas');
                canvas.id = `chart-${posIndex}-${candIndex}`;
                chartWrapper.appendChild(canvas);
                item.appendChild(chartWrapper);

                card.appendChild(item);

                createChart(canvas, Number(cand.percentageValue || 0), '#a90000');
            });

            container.appendChild(card);
        });
    }

    // Render current static HTML placeholders first (current UX).
    renderExistingPlaceholders();

    // After voting closes, render backend-computed results.
    (async () => {
        try {
            const res = await fetch(apiUrl('/api/results?electionId=skc'), { credentials: 'include' });
            if (!res.ok) return;
            const data = await res.json().catch(() => null);
            if (!data || data.status !== 'closed' || !Array.isArray(data.results)) return;

            const sub = document.querySelector('.results-subdate');
            if (sub && data.generatedAt) {
                try {
                    sub.textContent = `As of ${new Date(data.generatedAt).toLocaleDateString('en-US')}`;
                } catch {
                    // ignore
                }
            }

            renderBackendResults(data.results);
        } catch {
            // ignore (keep placeholders)
        }
    })();
});