const BACKEND_HOST = location.hostname === "127.0.0.1" ? "127.0.0.1" : "localhost";
const API_BASE = location.protocol === "file:" || location.port === "5500" ? `http://${BACKEND_HOST}:3000` : "";
const apiUrl = (p) => `${API_BASE}${p}`;

const form = document.getElementById("registerForm");
const overlay = document.getElementById("notification-overlay");

const backBtn = document.getElementById("backBtn");
if (backBtn) {
  backBtn.addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "loginn.html";
    }
  });
}

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

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const fullName = (document.getElementById("fullname")?.value || "").trim();
  const course = (document.getElementById("course")?.value || "").trim();
  const department = (document.getElementById("department")?.value || "").trim();
  const studentId = (document.getElementById("studentid")?.value || "").trim();
  const email = (document.getElementById("email")?.value || "").trim();
  const password = document.getElementById("password")?.value || "";
  const gradDate = document.getElementById("gradDate")?.value || "";

  if (!fullName || !course || !department || !studentId || !email || !password || !gradDate) {
    alert("Please complete all fields.");
    return;
  }

  try {
    const res = await fetch(apiUrl('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        fullname: fullName,
        course,
        department,
        studentid: studentId,
        email,
        password,
        gradDate
      })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = data && data.error ? `Registration failed: ${data.error}` : 'Registration failed.';
      alert(msg);
      return;
    }

    const data = await res.json().catch(() => ({}));
    if (data && data.user) {
      localStorage.setItem('currentUser', JSON.stringify(data.user));
    }

    if (overlay) overlay.classList.add('show');
    form.reset();

    // Keep existing UX: go to login page after register
    setTimeout(() => {
      window.location.href = 'loginn.html';
    }, 700);
  } catch {
    alert('Server is not running. Start the backend and try again.');
  }
});
