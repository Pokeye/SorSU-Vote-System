document.addEventListener('DOMContentLoaded', () => {
  const receiptStateEmpty = document.getElementById('receiptStateEmpty');
  const receiptStateLoaded = document.getElementById('receiptStateLoaded');
  const receiptIdEl = document.getElementById('receiptId');
  const receiptTimestampEl = document.getElementById('receiptTimestamp');
  const voteSummaryEl = document.getElementById('voteSummary');
  const backHomeBtn = document.getElementById('backHomeBtn');

  if (backHomeBtn) {
    backHomeBtn.addEventListener('click', () => {
      window.location.href = 'homeplage.html';
    });
  }

  let receipt;
  try {
    const raw = sessionStorage.getItem('lastReceipt');
    receipt = raw ? JSON.parse(raw) : null;
  } catch (e) {
    receipt = null;
  }

  if (!receipt || !receipt.receiptID || !receipt.timestamp) {
    if (receiptStateEmpty) receiptStateEmpty.style.display = 'block';
    if (receiptStateLoaded) receiptStateLoaded.style.display = 'none';
    return;
  }

  if (receiptStateEmpty) receiptStateEmpty.style.display = 'none';
  if (receiptStateLoaded) receiptStateLoaded.style.display = 'block';

  receiptIdEl.textContent = receipt.receiptID;
  receiptTimestampEl.textContent = receipt.timestamp;

  const votes = receipt.votes || {};
  const entries = Object.entries(votes);

  if (entries.length === 0) {
    voteSummaryEl.innerHTML = '<p><strong>Selections:</strong> (not available)</p>';
    return;
  }

  voteSummaryEl.innerHTML = entries
    .map(([position, candidate]) => `<p><strong>${position}:</strong> ${candidate}</p>`)
    .join('');
});
