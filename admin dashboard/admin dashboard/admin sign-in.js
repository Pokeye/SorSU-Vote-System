document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_HOST = location.hostname === "127.0.0.1" ? "127.0.0.1" : "localhost";
    const API_BASE = location.protocol === "file:" || location.port === "5500" ? `http://${BACKEND_HOST}:3000` : "";
    const apiUrl = (p) => `${API_BASE}${p}`;
  

    const toggles = document.querySelectorAll('.password-toggle');
    

    toggles.forEach(toggle => {
      
        toggle.innerHTML = 'Show';
        toggle.style.cursor = 'pointer';
        toggle.style.fontSize = '0.85rem';
        toggle.style.fontWeight = '600';
        toggle.style.letterSpacing = '0.02em';
        toggle.style.color = '#666';
        toggle.style.opacity = '0.9';

        toggle.addEventListener('click', () => {

            const inputId = toggle.getAttribute('data-target');
            const inputField = document.getElementById(inputId);

            if (inputField.type === 'password') {
       
                inputField.type = 'text';
     
                toggle.innerHTML = 'Hide';
                toggle.style.color = '#333';

            } else {
             
                inputField.type = 'password';
             
                toggle.innerHTML = 'Show';
                toggle.style.color = '#666';
            }
        });
    });

    const loginLink = document.querySelector('.login-btn');
    if (loginLink) {
        loginLink.addEventListener('click', async (event) => {
            event.preventDefault();

            const accessCode = document.getElementById('accessCode')?.value ?? '';
            const adminKey = document.getElementById('adminKey')?.value ?? '';

            if (accessCode.trim() === '' || adminKey.trim() === '') {
                alert('Please enter both the Access Code and Admin Key.');
                return;
            }

            try {
                const res = await fetch(apiUrl('/api/auth/admin-login'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ accessCode, adminKey })
                });

                if (!res.ok) {
                    alert('Invalid Access Code or Admin Key.');
                    return;
                }

                window.location.href = 'dashboard.html';
            } catch {
                alert('Server is not running. Start the backend and try again.');
            }
        });
    }

    //Optional :((((
    /*
    const loginButton = document.querySelector('.login-btn');
    loginButton.addEventListener('click', (event) => {
        const accessCode = document.getElementById('accessCode').value;
        const adminKey = document.getElementById('adminKey').value;

  
        if (accessCode.trim() === '' || adminKey.trim() === '') {
            alert('Please enter both the Access Code and Admin Key.');
            event.preventDefault(); 
            return;
        }


    });*/
});