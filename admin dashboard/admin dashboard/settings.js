const BACKEND_HOST = location.hostname === "127.0.0.1" ? "127.0.0.1" : "localhost";
const API_BASE = location.protocol === "file:" || location.port === "5500" ? `http://${BACKEND_HOST}:3000` : "";
const apiUrl = (p) => `${API_BASE}${p}`;

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

    window.location.href = "admin.html";
  });
}
