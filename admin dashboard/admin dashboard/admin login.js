const BACKEND_HOST = location.hostname === "127.0.0.1" ? "127.0.0.1" : "localhost";
const API_BASE = location.protocol === "file:" || location.port === "5500" ? `http://${BACKEND_HOST}:3000` : "";
const apiUrl = (p) => `${API_BASE}${p}`;

document.getElementById("loginForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const identifierEl = document.getElementById("identifier");
    const passwordEl = document.getElementById("password");

    const identifier = identifierEl ? identifierEl.value.trim() : "";
    const password = passwordEl ? passwordEl.value : "";

    if (!identifier || !password) {
        alert("Please enter your Email/ID and Password.");
        return;
    }

    try {
        const res = await fetch(apiUrl("/api/auth/login"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ identifier, password })
        });

        if (!res.ok) {
            if (res.status === 404) {
                alert("Backend not found. Start the backend and open http://localhost:3000/");
            } else {
                alert("Invalid login details.");
            }
            return;
        }

        // Do not redirect normal/student logins into the admin dashboard.
        // Keep the admin dashboard restricted to Access Code + Admin Key.
        alert("This is the Admin Dashboard. Student/Voter accounts cannot access admin pages. Please use 'Sign in as Admin'.");

        // Clear the session created by /api/auth/login so it doesn't confuse access control.
        try {
            await fetch(apiUrl("/api/auth/logout"), { method: "POST", credentials: "include" });
        } catch {
            // ignore
        }
    } catch {
        alert("Server is not running. Start the backend and try again.");
    }
});

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
