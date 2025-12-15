function goBack() {
  window.history.back();
}

const BACKEND_HOST = location.hostname === "127.0.0.1" ? "127.0.0.1" : "localhost";
const API_BASE = location.protocol === "file:" || location.port === "5500" ? `http://${BACKEND_HOST}:3000` : "";
const apiUrl = (p) => `${API_BASE}${p}`;

document.getElementById("resetForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();

  if (!email) {
    alert("Please enter your email.");
    return;
  }

  fetch(apiUrl("/api/auth/forgot"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email })
  })
    .then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (data && data.token) {
        console.log("DEV password reset token:", data.token);
      }
      alert("If an account exists for that email, a reset link was sent.");
    })
    .catch(() => {
      alert("Server is not running. Start the backend and try again.");
    });
});
