(function () {
  const openButton = document.getElementById('openCreateElection');
  const modal = document.getElementById('createElectionModal');
  const closeButton = document.getElementById('closeCreateElection');

  if (!openButton || !modal || !closeButton) return;

  function openModal() {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  }

  openButton.addEventListener('click', openModal);
  closeButton.addEventListener('click', closeModal);

  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });
})();
