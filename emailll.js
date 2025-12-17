function goBack() {
  window.history.back();
}

document.getElementById("resetForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();

  if (email) {
    const BACKEND_HOST = location.hostname === "127.0.0.1" ? "127.0.0.1" : "localhost";
    const API_BASE = location.protocol === "file:" || location.port === "5500" ? `http://${BACKEND_HOST}:3000` : "";
    const apiUrl = (p) => `${API_BASE}${p}`;

    (async () => {
      try {
        const res = await fetch(apiUrl('/api/auth/forgot'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email })
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data && data.error ? `Request failed: ${data.error}` : 'Request failed.';
          alert(msg);
          return;
        }

        // Avoid user enumeration: backend may return ok:true without token.
        if (data && typeof data.token === 'string' && data.token.length >= 4) {
          const suffix = data.token.slice(-4);
          sessionStorage.setItem('resetToken', data.token);
          sessionStorage.setItem('resetCodeSuffix', suffix);

          // Dev/demo: show the code since we are not actually emailing it.
          alert(`Verification code: ${suffix}`);
        } else {
          sessionStorage.removeItem('resetToken');
          sessionStorage.removeItem('resetCodeSuffix');
          alert(`If the account exists, a verification code was generated for ${email}.`);
        }
        window.location.href = 'verifcation.html';
      } catch {
        alert('Server is not running. Start the backend and try again.');
      }
    })();
  } else {
    alert("Please enter your email.");
  }
});
