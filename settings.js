(function () {
  const logoutBtn = document.getElementById('logoutBtn');
  if (!logoutBtn) return;

  const BACKEND_HOST = location.hostname === "127.0.0.1" ? "127.0.0.1" : "localhost";
  const API_BASE = location.protocol === "file:" || location.port === "5500" ? `http://${BACKEND_HOST}:3000` : "";
  const apiUrl = (p) => `${API_BASE}${p}`;

  logoutBtn.addEventListener('click', async function () {
    try {
      await fetch(apiUrl('/api/auth/logout'), {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      // ignore network errors; still clear local state below
    }

    try {
      // Log out without deleting registered mock accounts.
      localStorage.removeItem('currentUser');
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('resetToken');
      sessionStorage.removeItem('resetCodeSuffix');
    } catch (e) {
      // ignore storage errors
    }

    window.location.href = 'loginn.html';
  });
})();
