document.addEventListener('DOMContentLoaded', () => {
  const BACKEND_HOST = location.hostname === '127.0.0.1' ? '127.0.0.1' : 'localhost';
  const API_BASE = location.protocol === 'file:' || location.port === '5500' ? `http://${BACKEND_HOST}:3000` : '';
  const apiUrl = (p) => `${API_BASE}${p}`;

  function normalizeElectionId(raw) {
    const v = String(raw || '').trim().toLowerCase();
    if (!v) return 'skc';

    const map = {
      skc: 'skc',
      jpia: 'jpia',
      rcyc: 'rcyc',
      bookclub: 'bookclub',
      arts_dance: 'arts_dance',
      nstp: 'nstp',
      freethinker: 'freethinker',
      ssc: 'ssc',

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

  function displayNameForElectionId(id) {
    const map = {
      skc: 'SKC',
      jpia: 'JPIA',
      rcyc: 'RCYC',
      bookclub: 'Book Club',
      arts_dance: 'STAND',
      nstp: 'NSTP',
      freethinker: 'Freethinker',
      ssc: 'SSC'
    };
    return map[id] || String(id).toUpperCase();
  }

  const params = new URLSearchParams(window.location.search);
  const electionId = normalizeElectionId(params.get('electionId') || 'skc');

  const titleEl = document.querySelector('.page-title');
  if (titleEl) titleEl.textContent = 'Nominees';
  document.title = `Nominees - ${displayNameForElectionId(electionId)}`;

  const container = document.getElementById('nomineesContainer');
  if (!container) return;

  function renderPositions(positions) {
    container.innerHTML = '';

    if (!Array.isArray(positions) || positions.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'nominee-bio';
      empty.textContent = 'No candidates found.';
      container.appendChild(empty);
      return;
    }

    positions.forEach((pos) => {
      if (!pos || !pos.position) return;

      const group = document.createElement('div');
      group.className = 'position-group';

      const heading = document.createElement('h2');
      heading.className = 'position-title';
      heading.textContent = String(pos.position);
      group.appendChild(heading);

      const grid = document.createElement('div');
      grid.className = 'nominee-cards-grid';

      const candidates = Array.isArray(pos.candidates) ? pos.candidates : [];
      candidates.forEach((cand) => {
        if (!cand || !cand.name) return;

        const card = document.createElement('div');
        card.className = 'nominee-card';

        const icon = document.createElement('div');
        icon.className = 'profile-icon';
        icon.textContent = '☺︎';
        card.appendChild(icon);

        const details = document.createElement('div');
        details.className = 'nominee-details';

        const nameEl = document.createElement('p');
        nameEl.className = 'nominee-name';
        nameEl.textContent = String(cand.name);
        details.appendChild(nameEl);

        const partyEl = document.createElement('p');
        partyEl.className = 'nominee-id';
        partyEl.textContent = String(cand.party || '');
        details.appendChild(partyEl);

        card.appendChild(details);
        grid.appendChild(card);
      });

      group.appendChild(grid);
      container.appendChild(group);
    });
  }

  (async () => {
    try {
      const res = await fetch(apiUrl(`/api/candidates?electionId=${encodeURIComponent(electionId)}`), {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to load candidates');
      const data = await res.json().catch(() => null);
      if (!data || !Array.isArray(data.positions)) {
        renderPositions([]);
        return;
      }
      renderPositions(data.positions);
    } catch {
      renderPositions([]);
    }
  })();
});
