document.addEventListener('DOMContentLoaded', () => {
  const BACKEND_HOST = location.hostname === "127.0.0.1" ? "127.0.0.1" : "localhost";
  const API_BASE = location.protocol === "file:" || location.port === "5500" ? `http://${BACKEND_HOST}:3000` : "";
  const apiUrl = (p) => `${API_BASE}${p}`;

  const nameEl = document.getElementById('profileName');
  const courseEl = document.getElementById('profileCourse');
  const studentIdEl = document.getElementById('profileStudentId');
  const departmentEl = document.getElementById('profileDepartment');
  const emailEl = document.getElementById('profileEmail');

  function fillFromUser(user) {
    if (!user) return;

    const fullname = user.fullname || user.fullName || '';
    const course = user.course || '';
    const department = user.department || '';
    const studentid = user.studentid || user.studentId || '';
    const email = user.email || '';

    if (nameEl) nameEl.textContent = fullname;
    if (courseEl) courseEl.textContent = course;
    if (studentIdEl) studentIdEl.textContent = studentid;
    if (departmentEl) departmentEl.textContent = department;
    if (emailEl) emailEl.textContent = email;
  }

  (async () => {
    try {
      const res = await fetch(apiUrl('/api/auth/me'), { credentials: 'include' });
      const data = await res.json().catch(() => null);

      if (res.ok && data && data.authenticated && data.user) {
        fillFromUser(data.user);
        try {
          localStorage.setItem('currentUser', JSON.stringify(data.user));
        } catch {
          // ignore
        }
        return;
      }

      // Fallback: use any cached user (useful if backend is unreachable)
      const raw = localStorage.getItem('currentUser');
      const cached = raw ? JSON.parse(raw) : null;
      if (cached) {
        fillFromUser(cached);
        return;
      }

      window.location.href = 'loginn.html';
    } catch {
      // Backend not reachable
      try {
        const raw = localStorage.getItem('currentUser');
        const cached = raw ? JSON.parse(raw) : null;
        if (cached) {
          fillFromUser(cached);
          return;
        }
      } catch {
        // ignore
      }
      window.location.href = 'loginn.html';
    }
  })();
});
