document.addEventListener('DOMContentLoaded', () => {
    // Select all clickable links within the notification cards
    const notificationLinks = document.querySelectorAll('.notification-link');
    
    // Add a click listener to each link for logging/read status
    notificationLinks.forEach((link) => {
        link.addEventListener('click', () => {
            const card = link.querySelector('.notification-card');
            console.log(`Navigating to full announcement for: ${card.querySelector('.message').textContent.substring(0, 30)}...`);
            
            // Optional: Visually mark the notification as 'read'
            // link.classList.add('read'); 
        });
    });

    // Back button functionality
    const backBtn = document.querySelector('.back-btn');
    backBtn.addEventListener('click', (event) => {
        event.preventDefault(); 
        window.history.back(); 
    });
});