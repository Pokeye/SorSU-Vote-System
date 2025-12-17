const container = document.getElementById("cardContainer");

const BACKEND_HOST = location.hostname === "127.0.0.1" ? "127.0.0.1" : "localhost";
const API_BASE = location.protocol === "file:" || location.port === "5500" ? `http://${BACKEND_HOST}:3000` : "";
const apiUrl = (p) => `${API_BASE}${p}`;

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

function safeText(text) {
  return String(text ?? "");
}

function renderNomination(nominee) {
  const card = document.createElement("div");
  card.className = "card gray";

  card.innerHTML = `
    <div class="card-left">
      <div class="avatar">👤</div>
      <div class="info">
        <h3>${safeText(nominee.name)}</h3>
        <p>${safeText(nominee.section)}</p>
        <div class="quote">"Pending"</div>
      </div>
    </div>
    <div class="actions">
      <button class="btn accept">Accept</button>
      <button class="btn reject">Reject</button>
    </div>
  `;

  const [acceptBtn, rejectBtn] = card.querySelectorAll("button");

  acceptBtn.addEventListener("click", () => handleAction("accept", nominee, card));
  rejectBtn.addEventListener("click", () => handleAction("reject", nominee, card));

  return card;
}

async function handleAction(action, nominee, cardEl) {
  try {
    const res = await fetch(apiUrl(`/api/nominations/${encodeURIComponent(nominee.id)}/${action}`), {
      method: "POST",
      credentials: "include"
    });

    if (!res.ok) {
      if (res.status === 401) {
        window.location.href = 'admin sign-in.html';
        return;
      }
      alert("Not authorized. Sign in as Admin first.");
      return;
    }

    const quoteEl = cardEl.querySelector(".quote");
    quoteEl.textContent = action === "accept" ? '"Accepted"' : '"Rejected"';
  } catch {
    alert("Server is not running. Start the backend and try again.");
  }
}

async function loadNominations() {
  if (!container) return;
  container.innerHTML = "";

  const ok = await requireAdminOrRedirect();
  if (!ok) return;

  try {
    const res = await fetch(apiUrl("/api/nominations"), { credentials: "include" });
    if (!res.ok) {
      if (res.status === 401) {
        window.location.href = 'admin sign-in.html';
        return;
      }
      container.innerHTML = "<p style=\"padding:16px\">Unable to load nominations.</p>";
      return;
    }

    const nominations = await res.json();
    nominations.forEach(n => container.appendChild(renderNomination(n)));
  } catch {
    container.innerHTML = "<p style=\"padding:16px\">Server is not running.</p>";
  }
}

loadNominations();
