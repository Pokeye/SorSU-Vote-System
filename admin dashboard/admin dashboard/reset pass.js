function goBack() {
  history.back();
}

const BACKEND_HOST = location.hostname === "127.0.0.1" ? "127.0.0.1" : "localhost";
const API_BASE = location.protocol === "file:" || location.port === "5500" ? `http://${BACKEND_HOST}:3000` : "";
const apiUrl = (p) => `${API_BASE}${p}`;

document.querySelectorAll(".password-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.getAttribute("data-target");
    const input = document.getElementById(targetId);
    if (!input) return;

    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    btn.textContent = isHidden ? "Hide" : "Show";
    btn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
  });
});
const form = document.getElementById("resetPass");

form.addEventListener("submit", function(e) {
  e.preventDefault(); 

  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (!token) {
    alert("Missing reset token. Use the reset link from 'Forgot Password'.");
    return;
  }

  fetch(apiUrl("/api/auth/reset"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ token, password })
  })
    .then(async (res) => {
      if (!res.ok) {
        alert("Reset token is invalid or expired.");
        return;
      }

      alert("Password reset successfully!");
      window.location.href = "login.html";
    })
    .catch(() => {
      alert("Server is not running. Start the backend and try again.");
    });
});
