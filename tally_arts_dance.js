document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_HOST = location.hostname === "127.0.0.1" ? "127.0.0.1" : "localhost";
    const API_BASE = location.protocol === "file:" || location.port === "5500" ? `http://${BACKEND_HOST}:3000` : "";
    const apiUrl = (p) => `${API_BASE}${p}`;

    // Placeholder data (kept for current UX when results are still open)
    const resultsData = [
        {
            position: "President",
            candidates: [
                { id: "chart-ad-president-arturo", name: "Arturo Dela Cruz", votes: 65, percentage: "65%", color: "#a90000" }
            ]
        },
        {
            position: "Vice President for Dance",
            candidates: [
                { id: "chart-ad-vpdance-vicki", name: "Vicki Belo", votes: 88, percentage: "88%", color: "#a90000" }
            ]
        },
        {
            position: "VP for Culture & Arts",
            candidates: [
                { id: "chart-ad-vpculture-aga", name: "Aga Muhlach", votes: 72, percentage: "72%", color: "#a90000" }
            ]
        },
        {
            position: "Secretary",
            candidates: [
                { id: "chart-ad-secretary-sarah", name: "Sarah G.", votes: 45, percentage: "45%", color: "#ffc107" },
                { id: "chart-ad-secretary-bamboo", name: "Bamboo Manalac", votes: 55, percentage: "55%", color: "#ffc107" }
            ]
        },
        {
            position: "Treasurer",
            candidates: [
                { id: "chart-ad-treasurer-kathryn", name: "Kathryn Bernardo", votes: 95, percentage: "95%", color: "#a90000" }
            ]
        },
        {
            position: "Communications Officer",
            candidates: [
                { id: "chart-ad-comm-daniel", name: "Daniel Padilla", votes: 78, percentage: "78%", color: "#a90000" }
            ]
        },
        {
            position: "Muse",
            candidates: [
                { id: "chart-ad-muse-liza", name: "Liza Soberano", votes: 100, percentage: "100%", color: "#a90000" }
            ]
        }
    ];

    const createChart = (canvasEl, percentage, color) => {
        if (!canvasEl) return;
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
                    x: { display: false, beginAtZero: true, max: 100 },
                    y: { display: false }
                },
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                layout: { padding: 0 },
                elements: { bar: { borderRadius: 5 } }
            }
        });
    };

    function renderExistingPlaceholders() {
        resultsData.forEach(position => {
            position.candidates.forEach(candidate => {
                const canvasElement = document.getElementById(candidate.id);
                if (!canvasElement) return;

                const candidateItem = canvasElement.closest('.candidate-result-item');
                const headerRow = candidateItem ? candidateItem.querySelector('.candidate-header-row') : null;

                if (candidateItem) {
                    const nameElement = candidateItem.querySelector('.candidate-name');
                    if (nameElement && candidate.name) nameElement.textContent = candidate.name;
                }

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

    renderExistingPlaceholders();

    (async () => {
        try {
            const res = await fetch(apiUrl('/api/results?electionId=arts_dance'), { credentials: 'include' });
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