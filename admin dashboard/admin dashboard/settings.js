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

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await fetch(apiUrl("/api/auth/logout"), {
        method: "POST",
        credentials: "include"
      });
    } catch {
      // Even if the backend is unreachable, send them back to login.
    }

    window.location.href = "../../loginn.html";
  });
}

requireAdminOrRedirect();
