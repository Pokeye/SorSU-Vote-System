(function () {
  const logoutBtn = document.getElementById('logoutBtn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', function () {
    try {
      // Log out without deleting registered mock accounts.
      localStorage.removeItem('currentUser');
      sessionStorage.removeItem('currentUser');
    } catch (e) {
      // ignore storage errors
    }

    window.location.href = 'loginn.html';
  });
})();
