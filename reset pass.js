function goBack() {
  history.back();
}
const form = document.getElementById("resetPass");

form.addEventListener("submit", function(e) {
  e.preventDefault(); 

  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  const token = sessionStorage.getItem('resetToken');
  if (!token) {
    alert('No reset token found. Please request a new reset link.');
    window.location.href = 'email.html';
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  const BACKEND_HOST = location.hostname === "127.0.0.1" ? "127.0.0.1" : "localhost";
  const API_BASE = location.protocol === "file:" || location.port === "5500" ? `http://${BACKEND_HOST}:3000` : "";
  const apiUrl = (p) => `${API_BASE}${p}`;

  (async () => {
    try {
      const res = await fetch(apiUrl('/api/auth/reset'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, password })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data && data.error ? `Reset failed: ${data.error}` : 'Reset failed.';
        alert(msg);
        return;
      }

      sessionStorage.removeItem('resetToken');
      sessionStorage.removeItem('resetCodeSuffix');

      alert('Password reset successfully!');
      window.location.href = 'loginn.html';
    } catch {
      alert('Server is not running. Start the backend and try again.');
    }
  })();
});
