const BACKEND_HOST = location.hostname === "127.0.0.1" ? "127.0.0.1" : "localhost";
const API_BASE = location.protocol === "file:" || location.port === "5500" ? `http://${BACKEND_HOST}:3000` : "";
const apiUrl = (p) => `${API_BASE}${p}`;

const titleEl = document.getElementById('resultsTitle');
const bodyEl = document.getElementById('resultsBody');

function setCard(title, lines) {
  if (titleEl) titleEl.textContent = title;
  if (!bodyEl) return;

  if (!lines || lines.length === 0) {
    bodyEl.innerHTML = '<p>Analytics will appear here once polls have votes.</p>';
    return;
  }

  bodyEl.innerHTML = lines.map((t) => `<p>${escapeHtml(t)}</p>`).join('');
}

function escapeHtml(input) {
  return String(input ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function loadAnalytics() {
  try {
    // Hard guard: if not admin, redirect.
    const meRes = await fetch(apiUrl('/api/auth/me'), { credentials: 'include' });
    if (!meRes.ok) {
      window.location.href = 'admin sign-in.html';
      return;
    }
    const me = await meRes.json();
    if (!me || me.admin !== true) {
      window.location.href = 'admin sign-in.html';
      return;
    }

    const res = await fetch(apiUrl('/api/elections'), { credentials: 'include' });

    if (!res.ok) {
      if (res.status === 401) {
        window.location.href = 'admin sign-in.html';
        return;
      }

      setCard('Unable to load', ['Failed to load analytics.']);
      return;
    }

    const data = await res.json();
    const elections = Array.isArray(data?.elections) ? data.elections : [];

    if (elections.length === 0) {
      setCard('No elections found', []);
      return;
    }

    const totalBallots = elections.reduce((sum, e) => sum + (Number(e?.totalBallots) || 0), 0);
    const lines = elections.map((e) => {
      const id = String(e?.id ?? '');
      const status = String(e?.status ?? 'open');
      const votes = Number(e?.totalBallots) || 0;
      return `${id}: ${status} • votes: ${votes}`;
    });

    setCard(`Total votes: ${totalBallots}`, lines);
  } catch {
    window.location.href = 'admin sign-in.html';
  }
}

loadAnalytics();
