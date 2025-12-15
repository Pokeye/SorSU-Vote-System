// ----------------------
// 3D Carousel
// ----------------------
// ----------------------
// 3D Carousel / Sidebar Animation
// ----------------------
const swiper = new Swiper('.swiper-container.one', {
    loop: true,
    centeredSlides: true,
    slidesPerView: 5, // Display 5 slides at once
    spaceBetween: 20, // Space between icons
    autoplay: { 
        delay: 3000, 
        disableOnInteraction: false 
    },
    // REMOVED: pagination (no dots in image)
    // REMOVED: effect: 'coverflow' (using simple slide for icon look)
    speed: 500
});

const orgNameDisplays = document.querySelectorAll('#org-name-display, #org-name-display-secondary');

function updateOrgName() {
    // Get the data-name from the currently active slide
    // Swiper uses .swiper-slide-active for the main slide
    const activeSlide = document.querySelector('.swiper-slide-active');
    
    // Fallback if the index is somehow out of sync during transitions
    if (!activeSlide) return; 

    const name = activeSlide.dataset.name || '';
    orgNameDisplays.forEach((el) => {
      el.textContent = name;
    });
}

// Initial update
updateOrgName();

// Update name whenever the slide changes or the user clicks a slide
swiper.on('slideChangeTransitionEnd', updateOrgName);

// ----------------------
// Countdown Timer
// ----------------------
function startCountdown() {
  const endDate = new Date("2025-12-31T23:59:59").getTime();
  setInterval(() => {
    const now = Date.now();
    const distance = endDate - now;

    if(distance <= 0) return;

    const days = Math.floor(distance / (1000*60*60*24));
    const hours = Math.floor((distance % (1000*60*60*24)) / (1000*60*60));
    const mins = Math.floor((distance % (1000*60*60)) / (1000*60));
    const secs = Math.floor((distance % (1000*60)) / 1000);

    document.getElementById("days").innerText = days;
    document.getElementById("hours").innerText = hours;
    document.getElementById("mins").innerText = mins;
    document.getElementById("secs").innerText = secs;
  }, 1000);
}
startCountdown();

// ----------------------
// Voting Closed (Already Voted)
// ----------------------
(() => {
  let hasVoted = false;
  try {
    hasVoted = localStorage.getItem('hasVoted') === 'true';
  } catch (e) {
    hasVoted = false;
  }

  if (!hasVoted) return;

  const statusEl = document.querySelector('.status');
  if (statusEl) statusEl.textContent = 'Voting Closed';

  const voteBtn = document.querySelector('.vote-btn');
  if (voteBtn) {
    voteBtn.textContent = 'Voting Closed';
    voteBtn.disabled = true;
    voteBtn.style.opacity = '0.7';
    voteBtn.style.cursor = 'not-allowed';
  }

  const voteLink = document.querySelector('.vote-link');
  if (voteLink) {
    voteLink.removeAttribute('href');
    voteLink.addEventListener('click', (e) => e.preventDefault());
    voteLink.style.pointerEvents = 'none';
  }
})();
