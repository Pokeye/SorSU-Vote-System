(function () {
  const openButton = document.getElementById('openCreateElection');
  const modal = document.getElementById('createElectionModal');
  const closeButton = document.getElementById('closeCreateElection');
  const saveButton = document.querySelector('.pm-save-btn');

  const orgClubEl = document.getElementById('orgClub');
  const eventStartEl = document.getElementById('eventStart');
  const eventEndEl = document.getElementById('eventEnd');
  const positionIncludedEl = document.getElementById('positionIncluded');

  if (!openButton || !modal || !closeButton) return;

  function openModal() {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  }

  openButton.addEventListener('click', openModal);
  closeButton.addEventListener('click', closeModal);

  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  const BACKEND_HOST = location.hostname === "127.0.0.1" ? "127.0.0.1" : "localhost";
  const API_BASE = location.protocol === "file:" || location.port === "5500" ? `http://${BACKEND_HOST}:3000` : "";
  const apiUrl = (p) => `${API_BASE}${p}`;

  function slugifyElectionId(input) {
    return String(input || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 48);
  }

  function isoToDate(iso) {
    const s = String(iso || '');
    return s.length >= 10 ? s.slice(0, 10) : '';
  }

  async function requireAdminOrRedirect() {
    try {
      const res = await fetch(apiUrl('/api/auth/me'), { credentials: 'include' });
      if (!res.ok) {
        window.location.href = 'admin sign-in.html';
        return false;
      }
      const data = await res.json();
      if (!data || data.admin !== true) {
        window.location.href = 'admin sign-in.html';
        return false;
      }
      return true;
    } catch {
      window.location.href = 'admin sign-in.html';
      return false;
    }
  }

  async function saveElection() {
    const orgClub = orgClubEl?.value ?? '';
    const eventStart = eventStartEl?.value ?? '';
    const eventEnd = eventEndEl?.value ?? '';
    const positionIncluded = positionIncludedEl?.value ?? '';

    const electionId = slugifyElectionId(orgClub);

    if (!String(orgClub).trim()) {
      alert('Please enter an organization/club name.');
      return;
    }

    if (!String(eventEnd).trim()) {
      alert('Please select an end date.');
      return;
    }

    if (!String(positionIncluded).trim()) {
      alert('Please select a position.');
      return;
    }

    try {
      const res = await fetch(apiUrl('/api/elections'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ electionId, orgClub, eventStart, eventEnd, positionIncluded })
      });

      if (!res.ok) {
        if (res.status === 401) {
          alert('Not authorized. Sign in as Admin first.');
          window.location.href = 'admin sign-in.html';
          return;
        }
        alert('Failed to save election.');
        return;
      }

      const data = await res.json();
      closeModal();
      const id = data?.election?.id ? String(data.election.id) : '';
      alert(id ? `Election saved: ${id}` : 'Election saved.');
    } catch {
      alert('Server is not running. Start the backend and try again.');
    }
  }

  async function maybePrefillExisting() {
    const orgClub = orgClubEl?.value ?? '';
    const electionId = slugifyElectionId(orgClub);
    if (!electionId) return;

    try {
      const res = await fetch(apiUrl('/api/elections'), { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      const elections = Array.isArray(data?.elections) ? data.elections : [];
      const found = elections.find((e) => String(e?.id || '') === electionId);
      if (!found) return;

      // Prefill existing dates to make re-opening/closing easier.
      if (eventStartEl && found.startAt && !eventStartEl.value) {
        eventStartEl.value = isoToDate(found.startAt);
      }
      if (eventEndEl && found.endAt) {
        eventEndEl.value = isoToDate(found.endAt);
      }

      // If a known position exists and user hasn't selected one yet, preselect first.
      if (positionIncludedEl && (!positionIncludedEl.value || positionIncludedEl.value === '')) {
        const positions = Array.isArray(found.positions) ? found.positions : [];
        if (positions.length > 0) {
          const candidate = String(positions[0]);
          const hasOption = Array.from(positionIncludedEl.options).some((o) => o && o.value === candidate);
          if (hasOption) positionIncludedEl.value = candidate;
        }
      }
    } catch {
      // ignore
    }
  }

  if (saveButton) {
    saveButton.addEventListener('click', saveElection);
  }

  requireAdminOrRedirect();

  if (orgClubEl) {
    orgClubEl.addEventListener('change', maybePrefillExisting);
    orgClubEl.addEventListener('blur', maybePrefillExisting);
  }
})();
