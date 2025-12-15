const form = document.getElementById("registerForm");
const overlay = document.getElementById("notification-overlay");

const BACKEND_HOST = location.hostname === "127.0.0.1" ? "127.0.0.1" : "localhost";
const API_BASE = location.protocol === "file:" || location.port === "5500" ? `http://${BACKEND_HOST}:3000` : "";
const apiUrl = (p) => `${API_BASE}${p}`;

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getMockUsers() {
  const raw = localStorage.getItem("mockUsers");
  const users = safeJsonParse(raw, []);
  return Array.isArray(users) ? users : [];
}

function saveMockUsers(users) {
  localStorage.setItem("mockUsers", JSON.stringify(users));
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

form.addEventListener("submit", async function(e) {
  e.preventDefault(); 

  const payload = {
    fullname: document.getElementById("fullname").value.trim(),
    course: document.getElementById("course").value.trim(),
    department: document.getElementById("department").value.trim(),
    studentid: document.getElementById("studentid").value.trim(),
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value,
    gradDate: document.getElementById("gradDate").value
  };

  // Always save to student-side mock storage first so student login stays reliable
  // even if the serverless backend is unavailable or loses state.
  const emailLower = String(payload.email || "").trim().toLowerCase();
  const studentId = String(payload.studentid || "").trim();

  const users = getMockUsers();
  const exists = users.some((u) => {
    if (!u) return false;
    const e = String(u.email || "").trim().toLowerCase();
    const s = String(u.studentId || "").trim();
    return e === emailLower || s === studentId;
  });

  if (exists) {
    alert("Account already exists (Email or Student ID). ");
    return;
  }

  users.push({
    fullName: String(payload.fullname || "").trim(),
    course: String(payload.course || "").trim(),
    department: String(payload.department || "").trim(),
    studentId,
    email: String(payload.email || "").trim(),
    password: String(payload.password || ""),
    gradDate: String(payload.gradDate || ""),
    createdAt: new Date().toISOString(),
  });
  saveMockUsers(users);

  // Best-effort: also register via backend (optional)
  try {
    const res = await fetch(apiUrl("/api/auth/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    });

    if (!res.ok && res.status !== 409) {
      // Do not block the flow; localStorage is already saved.
    }
  } catch {
    // Ignore backend failures; localStorage is already saved.
  }

  overlay.classList.add("show");
  form.reset();

  // This create-account page lives under the admin folder, but the student app lives at project root.
  // After creating an account, go to the student Login page.
  setTimeout(() => {
    window.location.href = "../../loginn.html";
  }, 700);
});
