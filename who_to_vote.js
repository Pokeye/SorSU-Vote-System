document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_HOST = location.hostname === "127.0.0.1" ? "127.0.0.1" : "localhost";
    const API_BASE = location.protocol === "file:" || location.port === "5500" ? `http://${BACKEND_HOST}:3000` : "";
    const apiUrl = (p) => `${API_BASE}${p}`;

    function normalizeElectionId(raw) {
        const v = String(raw || '').trim().toLowerCase();
        if (!v) return 'skc';

        const map = {
            // canonical ids
            skc: 'skc',
            jpia: 'jpia',
            rcyc: 'rcyc',
            bookclub: 'bookclub',
            arts_dance: 'arts_dance',
            nstp: 'nstp',
            freethinker: 'freethinker',
            ssc: 'ssc',

            // common aliases seen in UI
            'book-club': 'bookclub',
            'book club': 'bookclub',
            stand: 'arts_dance',
            'sports club': 'arts_dance',
            sportsclub: 'arts_dance',
            'arts and dance': 'arts_dance',
            'arts&dance': 'arts_dance'
        };

        return map[v] || v;
    }

    const params = new URLSearchParams(window.location.search);
    const electionId = normalizeElectionId(params.get('electionId') || 'skc');
    const hasVotedKey = `hasVoted:${electionId}`;

    function safeSlug(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 64);
    }

    function renderBallot(positions) {
        const container = document.getElementById('ballotContainer');
        if (!container) return;
        container.innerHTML = '';

        if (!Array.isArray(positions) || positions.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'select-hint';
            empty.textContent = 'No candidates found for this election.';
            container.appendChild(empty);
            return;
        }

        positions.forEach((pos, index) => {
            if (!pos || !pos.position) return;

            const section = document.createElement('div');
            section.className = 'position-section';

            const title = document.createElement('h2');
            title.className = 'position-title';
            title.textContent = String(pos.position);
            section.appendChild(title);

            const hint = document.createElement('p');
            hint.className = 'select-hint';
            hint.textContent = 'Select one';
            section.appendChild(hint);

            const group = document.createElement('div');
            group.className = 'candidate-card-group';

            const inputName = safeSlug(pos.position) || `pos_${index}`;
            const candidates = Array.isArray(pos.candidates) ? pos.candidates : [];
            candidates.forEach((cand, candIndex) => {
                if (!cand || !cand.name) return;

                const label = document.createElement('label');
                label.className = 'candidate-card';

                const input = document.createElement('input');
                input.type = 'radio';
                input.name = inputName;
                input.value = String(cand.name);
                input.id = `${inputName}_${candIndex}`;
                label.appendChild(input);

                const custom = document.createElement('span');
                custom.className = 'custom-radio';
                label.appendChild(custom);

                const info = document.createElement('div');
                info.className = 'candidate-info';

                const nameEl = document.createElement('span');
                nameEl.className = 'candidate-name';
                nameEl.textContent = String(cand.name);
                info.appendChild(nameEl);

                const partyEl = document.createElement('span');
                partyEl.className = 'candidate-party';
                partyEl.textContent = String(cand.party || '');
                info.appendChild(partyEl);

                label.appendChild(info);
                group.appendChild(label);
            });

            section.appendChild(group);
            container.appendChild(section);
        });

        document.querySelectorAll('.candidate-card').forEach(card => {
            card.addEventListener('click', () => {
                const input = card.querySelector('input');
                if (!input) return;

                if (input.type === 'radio') {
                    document.querySelectorAll(`input[name="${input.name}"]`).forEach(radio => {
                        const parentCard = radio.closest('.candidate-card');
                        if (parentCard) parentCard.style.border = '1px solid #eee';
                    });
                }

                card.style.border = '1px solid #a90000';
            });
        });
    }

    const backBtn = document.getElementById('electionBackBtn');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            // Prevent default so we can decide where to go.
            e.preventDefault();

            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = 'homeplage.html';
            }
        });
    }

    // If the voter already submitted a vote (backend), prevent voting again.
    (async () => {
        try {
            const res = await fetch(apiUrl(`/api/votes/status?electionId=${encodeURIComponent(electionId)}`), { credentials: 'include' });
            if (!res.ok) return;
            const data = await res.json().catch(() => null);
            if (!data) return;

            if (data.status === 'closed') {
                window.location.href = 'homeplage.html';
                return;
            }

            if (data.hasVoted) {
                window.location.href = 'homeplage.html';
                return;
            }

            // If not authenticated, send to login.
            if (!data.authenticated) {
                window.location.href = 'loginn.html';
            }
        } catch {
            // fallback: localStorage check
            try {
                if (localStorage.getItem(hasVotedKey) === 'true') {
                    window.location.href = 'homeplage.html';
                }
            } catch (e) {
                // ignore storage errors
            }
        }
    })();

    // Load candidates from backend and render the ballot.
    (async () => {
        try {
            const res = await fetch(apiUrl(`/api/candidates?electionId=${encodeURIComponent(electionId)}`), { credentials: 'include' });
            if (!res.ok) return;
            const data = await res.json().catch(() => null);
            if (!data || !Array.isArray(data.positions)) return;
            renderBallot(data.positions);
        } catch {
            // If server is down, the ballot will remain empty.
        }
    })();

    const votingForm = document.getElementById('votingForm');
    const voteSuccessPopup = document.getElementById('voteSuccessPopup');
    const closePopupBtn = document.getElementById('closePopupVote');
    const okPopupBtn = document.getElementById('okPopupVote');
    const receiptIdEl = document.getElementById('receiptId');
    const receiptTimestampEl = document.getElementById('receiptTimestamp');
    const receiptDetailsEl = document.getElementById('receiptDetails');

    // --- Helper Functions ---
    
    function generateReceiptId() {
        return '#' + Math.floor(10000000 + Math.random() * 90000000);
    }

    function formatTimestamp() {
        const now = new Date();
        const date = now.toLocaleDateString('en-US');
        const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        return `${date} ${time}`;
    }

    function goToHome() {
        voteSuccessPopup.classList.remove('show'); 
        window.location.href = 'homeplage.html'; 
    }

    function goToReceipt() {
        voteSuccessPopup.classList.remove('show');
        window.location.href = 'voters-receipt.html';
    }

    // --- Form Submission Logic ---
    if (votingForm) {
        votingForm.addEventListener('submit', async (event) => {
            event.preventDefault(); 

            const selectedVotes = {};
            let allPositionsSelected = true;
            const positionSections = document.querySelectorAll('.position-section');

            positionSections.forEach(section => {
                const positionTitle = section.querySelector('.position-title').textContent.trim();
                const radioChecked = section.querySelector('input[type="radio"]:checked');
                
                if (radioChecked) {
                    const candidateName = radioChecked.closest('.candidate-card').querySelector('.candidate-name').textContent;
                    selectedVotes[positionTitle] = candidateName;
                } else {
                    allPositionsSelected = false;
                }
            });

            if (allPositionsSelected) {
                try {
                    const res = await fetch(apiUrl('/api/votes/submit'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ electionId, votes: selectedVotes })
                    });

                    if (res.status === 401) {
                        window.location.href = 'loginn.html';
                        return;
                    }

                    const data = await res.json().catch(() => ({}));

                    if (!res.ok) {
                        const msg = data && data.error ? `Vote failed: ${data.error}` : 'Vote failed.';
                        alert(msg);
                        return;
                    }

                    // 1. Receipt details
                    const receiptID = data.receiptID || generateReceiptId();
                    const timestamp = data.timestamp ? new Date(data.timestamp).toLocaleString('en-US') : formatTimestamp();

                    // Save receipt data for the receipt page
                    try {
                        sessionStorage.setItem('lastReceipt', JSON.stringify({
                            receiptID,
                            timestamp,
                            votes: selectedVotes
                        }));
                        localStorage.setItem(hasVotedKey, 'true');
                    } catch (e) {
                        // ignore storage errors
                    }

                    // 2. Update the pop-up content (Receipt Box)
                    let voteSummaryHTML = `<p><strong>Receipt ID:</strong> <span id="receiptId">${receiptID}</span></p>`;
                    voteSummaryHTML += `<p><strong>Timestamp:</strong> <span id="receiptTimestamp">${timestamp}</span></p>`;
                    voteSummaryHTML += '<div class="vote-summary">';
                    for (const [position, candidate] of Object.entries(selectedVotes)) {
                        voteSummaryHTML += `<p><strong>${position}:</strong> ${candidate}</p>`;
                    }
                    voteSummaryHTML += '</div><p class="receipt-note">Thank you for your participation!</p>';
                    receiptDetailsEl.innerHTML = voteSummaryHTML;

                    // 3. Show the success pop-up
                    voteSuccessPopup.classList.add('show');
                } catch {
                    alert('Server is not running. Start the backend and try again.');
                }
            } else {
                alert("Please select a candidate for ALL positions before submitting.");
            }
        });
    }

    // --- Pop-up Redirection Handlers ---
    closePopupBtn.addEventListener('click', goToHome);
    okPopupBtn.addEventListener('click', goToReceipt);
    
});