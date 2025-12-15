function safeJsonParse(value, fallback) {
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

function stripZeroWidth(value) {
    return String(value || "").replace(/[\u200B-\u200D\uFEFF]/g, "");
}

function normalizeIdentifier(value) {
    return stripZeroWidth(value)
        .trim()
        // normalize various dash characters to '-'
        .replace(/[‐‑‒–—―]/g, "-")
        // remove any whitespace characters (often introduced on copy/paste)
        .replace(/\s+/g, "");
}

function normalizePassword(value) {
    return stripZeroWidth(value).trim();
}

const DEMO_USER = {
    fullName: "Demo Student",
    course: "BSIT",
    department: "CCS",
    studentId: "2025-0001",
    email: "student@sorsu.edu.ph",
    password: "student123",
    gradDate: "2028-06-30",
};

function getMockUsers() {
    const raw = localStorage.getItem("mockUsers");
    const users = safeJsonParse(raw, []);
    return Array.isArray(users) ? users : [];
}

function setMockUsers(users) {
    localStorage.setItem("mockUsers", JSON.stringify(users));
}

function ensureSeedMockUser() {
    const users = getMockUsers();
    const seed = { ...DEMO_USER, createdAt: new Date().toISOString() };

    const exists = users.some((u) => {
        if (!u) return false;
        const email = String(u.email || "").trim().toLowerCase();
        const studentId = String(u.studentId || "").trim();
        return email === seed.email.toLowerCase() || studentId === seed.studentId;
    });

    if (exists) return;
    users.push(seed);
    setMockUsers(users);
}

ensureSeedMockUser();

document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const identifierEl = document.getElementById("identifier");
    const passwordEl = document.getElementById("password");

    const rawIdentifier = identifierEl ? identifierEl.value : "";
    const rawPassword = passwordEl ? passwordEl.value : "";

    const identifier = normalizeIdentifier(rawIdentifier);
    const password = normalizePassword(rawPassword);

    if (!identifier || !password) {
        alert("Please enter your Email/ID and Password.");
        return;
    }

    // Demo account always works (useful for Vercel demos even if storage got messy)
    const demoId = normalizeIdentifier(DEMO_USER.studentId);
    const demoEmail = stripZeroWidth(DEMO_USER.email).trim().toLowerCase();
    const demoPass = normalizePassword(DEMO_USER.password);

    if ((identifier === demoId || identifier.toLowerCase() === demoEmail) && password === demoPass) {
        localStorage.setItem(
            "currentUser",
            JSON.stringify({
                fullName: DEMO_USER.fullName,
                email: DEMO_USER.email,
                studentId: DEMO_USER.studentId,
                course: DEMO_USER.course,
                department: DEMO_USER.department,
                createdAt: new Date().toISOString(),
            })
        );
        window.location.href = "homeplage.html";
        return;
    }

    const users = getMockUsers();
    const user = users.find((u) => {
        if (!u) return false;
        const email = stripZeroWidth(u.email).trim().toLowerCase();
        const studentId = normalizeIdentifier(u.studentId);
        const pass = normalizePassword(u.password);
        const identLower = identifier.toLowerCase();
        return (identLower === email || identifier === studentId) && password === pass;
    });

    if (user) {
        localStorage.setItem(
            "currentUser",
            JSON.stringify({
                fullName: user.fullName || "",
                email: user.email || "",
                studentId: user.studentId || "",
                course: user.course || "",
                department: user.department || "",
                createdAt: user.createdAt || "",
            })
        );
        window.location.href = "homeplage.html";
        return;
    }

    // If localStorage login fails (e.g., account was created via the Vercel /api backend),
    // try the serverless login endpoint as a fallback.
    try {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ identifier, password }),
        });

        if (res.ok) {
            localStorage.setItem(
                "currentUser",
                JSON.stringify({
                    fullName: "",
                    email: identifier.includes("@") ? identifier : "",
                    studentId: identifier.includes("@") ? "" : identifier,
                    course: "",
                    department: "",
                    createdAt: new Date().toISOString(),
                })
            );
            window.location.href = "homeplage.html";
            return;
        }
    } catch {
        // ignore and show the standard error below
    }

    alert("Invalid login details. Create an account first.");
});

const adminButton = document.querySelector(".admin-btn");
if (adminButton) {
    adminButton.addEventListener("click", function (e) {
        e.preventDefault();
        window.location.href = "admin dashboard/index.html";
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
