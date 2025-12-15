function makeAnnouncement() {
  const modal = document.getElementById("announcementModal");
  if (!modal) return;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");

  const titleInput = document.getElementById("announcementTitle");
  if (titleInput) titleInput.focus();
}

function closeAnnouncementModal() {
  const modal = document.getElementById("announcementModal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

const closeAnnouncementButton = document.getElementById("closeAnnouncementModal");
if (closeAnnouncementButton) {
  closeAnnouncementButton.addEventListener("click", closeAnnouncementModal);
}

const BACKEND_HOST = location.hostname === "127.0.0.1" ? "127.0.0.1" : "localhost";
const API_BASE = location.protocol === "file:" || location.port === "5500" ? `http://${BACKEND_HOST}:3000` : "";
const apiUrl = (p) => `${API_BASE}${p}`;

async function loadStats() {
  try {
    const res = await fetch(apiUrl("/api/stats"), { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json();

    if (typeof data.totalVoters !== "undefined") {
      document.getElementById("totalVoters").textContent = data.totalVoters;
    }
    if (typeof data.activeNow !== "undefined") {
      document.getElementById("activeNow").textContent = data.activeNow;
    }
  } catch {
    // ignore when offline
  }
}

loadStats();
