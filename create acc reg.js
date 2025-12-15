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

function ensureSeedMockUser() {
  const users = getMockUsers();
  const seed = {
    fullName: "Demo Student",
    course: "BSIT",
    department: "CCS",
    studentId: "2025-0001",
    email: "student@sorsu.edu.ph",
    password: "student123",
    gradDate: "2028-06-30",
    createdAt: new Date().toISOString(),
  };

  const exists = users.some((u) => {
    if (!u) return false;
    const email = String(u.email || "").trim().toLowerCase();
    const studentId = String(u.studentId || "").trim();
    return email === seed.email.toLowerCase() || studentId === seed.studentId;
  });

  if (exists) return;
  users.push(seed);
  saveMockUsers(users);
}

function saveMockUsers(users) {
  localStorage.setItem("mockUsers", JSON.stringify(users));
}

ensureSeedMockUser();

form.addEventListener("submit", function (e) {
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

  const users = getMockUsers();
  const alreadyExists = users.some((u) => {
    if (!u) return false;
    return (
      String(u.email || "").trim().toLowerCase() === email.toLowerCase() ||
      String(u.studentId || "").trim() === studentId
    );
  });

  if (alreadyExists) {
    alert("Account already exists for this Email or Student ID.");
    return;
  }

  users.push({
    fullName,
    course,
    department,
    studentId,
    email,
    password,
    gradDate,
    createdAt: new Date().toISOString(),
  });

  saveMockUsers(users);

  if (overlay) overlay.classList.add("show");
  form.reset();

  // After creating an account, go to Login page
  setTimeout(() => {
    window.location.href = "loginn.html";
  }, 700);
});
