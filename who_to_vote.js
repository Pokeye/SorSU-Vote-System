document.addEventListener('DOMContentLoaded', () => {
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

    // If the voter already submitted a vote, prevent voting again.
    try {
        if (localStorage.getItem('hasVoted') === 'true') {
            window.location.href = 'homeplage.html';
            return;
        }
    } catch (e) {
        // ignore storage errors
    }

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
        votingForm.addEventListener('submit', (event) => {
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
                // 1. Generate receipt details
                const receiptID = generateReceiptId();
                const timestamp = formatTimestamp();

                // Save receipt data for the receipt page
                try {
                    sessionStorage.setItem('lastReceipt', JSON.stringify({
                        receiptID,
                        timestamp,
                        votes: selectedVotes
                    }));

                    // Mark voter as already voted (used by homepage to show "Voting Closed")
                    localStorage.setItem('hasVoted', 'true');
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
                
            } else {
                alert("Please select a candidate for ALL positions before submitting.");
            }
        });
    }

    // --- Pop-up Redirection Handlers ---
    closePopupBtn.addEventListener('click', goToHome);
    okPopupBtn.addEventListener('click', goToReceipt);
    
    // Optional: Add card selection styling persistence
    document.querySelectorAll('.candidate-card').forEach(card => {
        card.addEventListener('click', () => {
             const input = card.querySelector('input');
             if (input.type === 'radio') {
                 // Reset border on all siblings in the group
                 document.querySelectorAll(`input[name="${input.name}"]`).forEach(radio => {
                    const parentCard = radio.closest('.candidate-card');
                    if (parentCard) {
                        parentCard.style.border = '1px solid #eee'; 
                    }
                 });
             }
             // Set red border on the newly selected card (handled by CSS, but good for persistence)
             card.style.border = '1px solid #a90000';
        });
    });
});