const form = document.getElementById("registerForm");
const overlay = document.getElementById("notification-overlay");

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

  try {
    const res = await fetch(apiUrl("/api/auth/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      if (res.status === 409) {
        alert("Account already exists (Email or Student ID). ");
      } else if (res.status === 400) {
        const data = await res.json().catch(() => ({}));
        if (data && data.error === 'invalid_course') {
          alert("Program/Course must be one of: BSCS, BSIT, BSIS, BTVTED, BPA, BSA, BSAIS, BSE.");
        } else if (data && data.error === 'invalid_department') {
          alert("Department must be either CICT or BME.");
        } else if (data && data.error === 'invalid_email_domain') {
          alert("Email must end with @gmail.com.");
        } else {
          alert("Registration failed. Please check your details.");
        }
      } else {
        alert("Registration failed. Please check your details.");
      }
      return;
    }

    // Also store the created account in the student-side mock storage.
    // This makes Student login reliable on Vercel even if the serverless backend
    // is running without persistent storage (KV).
    try {
      const raw = localStorage.getItem("mockUsers");
      const parsed = raw ? JSON.parse(raw) : [];
      const users = Array.isArray(parsed) ? parsed : [];

      const emailLower = String(payload.email || "").trim().toLowerCase();
      const studentId = String(payload.studentid || "").trim();

      const exists = users.some((u) => {
        if (!u) return false;
        const e = String(u.email || "").trim().toLowerCase();
        const s = String(u.studentId || "").trim();
        return e === emailLower || s === studentId;
      });

      if (!exists) {
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
        localStorage.setItem("mockUsers", JSON.stringify(users));
      }
    } catch {
      // ignore localStorage errors
    }

    overlay.classList.add("show");
    form.reset();

    // This create-account page lives under the admin folder, but the student app lives at project root.
    // After creating an account, go to the student Login page.
    setTimeout(() => {
      window.location.href = "../../loginn.html";
    }, 700);
  } catch {
    alert("Server is not running. Start the backend and try again.");
  }
});
