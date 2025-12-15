document.addEventListener('DOMContentLoaded', () => {
    const clubSelect = document.getElementById('club-select');
    const positionSelect = document.getElementById('position-select');
    const submitBtn = document.getElementById('submitNomination');
    const successPopup = document.getElementById('successPopup');
    const closePopupBtn = document.getElementById('closePopup');
    const okPopupBtn = document.getElementById('okPopup');
    
    // Image Upload Handling elements
    const pictureUpload = document.getElementById('picture-upload');
    const imageUploadInput = document.getElementById('image-upload-input');
    const uploadedImagePreview = document.getElementById('uploaded-image-preview');
    const cameraIconPlaceholder = document.getElementById('camera-icon-placeholder');

    // --- Image Upload Logic ---
    pictureUpload.addEventListener('click', () => {
        imageUploadInput.click();
    });

    imageUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedImagePreview.src = e.target.result;
                uploadedImagePreview.style.display = 'block';
                cameraIconPlaceholder.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });

    // --- Position Dropdown Data ---
    const clubPositions = {
        'ssc': ['President', 'Vice President', 'Secretary', 'Treasurer', 'Auditor', 'Public Relations Officer',, 'Business Manager', 'BPA Representatives', 'BSE Reprentative', 'BSCS Representative', 'BSIS Representative', 'BSIT Representative', 'BTVTED Representative'],
        'skc': ['President', 'Vice President', 'Secretary', 'Executive Secretary', 'Tresurer', 'Assistant Treasusrer', 'Auditor', 'Public Information Officer', 'Bussiness Manager', 'Liaison Officer', 'Layouyt Artist', 'Videographer', 'Photographer', 'Sports Writer'],
        'jpia': ['President', 'Vice President For Academics', 'Vice President for Non-Academics', 'Secretary', 'Finance Officer I - Collector', 'Finance Officer II - Disbrusement', 'Audtior', 'Public Information Information Officer', 'Chairperson For Internal Affairss', 'Ambassador', 'BSA Representative', 'BSAI Representative', 'BSE Representative'],
        'book-club': ['President', 'Vice President', 'Secretary', 'Researcher'],
        'nstp': ['President', 'Vice President', 'Secretary',, 'Assitant Secretary', 'Treasurer', 'Dusbursement Officer', 'Collertor Officer',, 'Auditor', 'P.I.O', 'Business Manager', 'Liaison', 'Senior Multimedia Head', 'Junior Multimedia Head', 'Multimedia', 'Creative  Writer', 'Muse', 'Escort'],
        'rcyc': ['President', 'Vice President', 'Secretary', 'Treasurer', 'Auditor', 'P.I.O', 'Peace Officer'],
        'stand': ['President', 'Vice President', 'Secretary', 'Treasurer', 'Auditor', 'P.I.O', 'Business Manager',, 'Vocal Coach', 'Dance Masrer', 'Show Coordinator],
        'freethinker': ['President', 'Vice President For Academics', 'Vice President for Non-Academics', 'Secretary', 'Finance Officer I - Collector', 'Finance Officer II - Disbrusement', 'Audtior', 'Public Information Information Officer', 'Chairperson For Internal Affairss', 'Ambassador', 'BSA Representative', 'BSAI Representative', 'BSE Representative']
    };

    // --- Position Dropdown Logic ---
    function updatePositions() {
        const selectedClub = clubSelect.value;
        // Use the actual club positions, or an empty array if not defined.
        const positions = clubPositions[selectedClub] || ['Officer', 'Member at Large']; 

        positionSelect.innerHTML = '<option value="">-- Select --</option>';

        positions.forEach(position => {
            const option = document.createElement('option');
            option.value = position.toLowerCase().replace(/\s/g, '-');
            option.textContent = position;
            positionSelect.appendChild(option);
        });
    }

    clubSelect.addEventListener('change', updatePositions);
    updatePositions(); 


    // --- Core Navigation Logic ---
    function goToHome() {
        successPopup.classList.remove('show'); 
        // Redirects to the homepage as requested
        window.location.href = 'homeplage.html'; 
    }
    
    // --- Form Submission and Popup Handling ---
    submitBtn.addEventListener('click', (event) => {
        event.preventDefault(); 

        // Basic validation check
        const nomineeName = document.getElementById('nominee-name').value.trim();
        const selectedPosition = positionSelect.value;
        const confirmationChecked = document.getElementById('confirm-meet').checked;

        if (!nomineeName || !selectedPosition || !confirmationChecked) {
             alert('Please fill out Nominee Name, Position, and confirm eligibility.');
             return;
        }

        // Simulate successful submission: Show success pop-up
        successPopup.classList.add('show');
    });

    // Event listeners to redirect to the homepage
    closePopupBtn.addEventListener('click', goToHome); // X button
    okPopupBtn.addEventListener('click', goToHome); // OK button
    
    // Click outside the modal just hides the popup
    successPopup.addEventListener('click', (e) => {
        if (e.target === successPopup) {
            successPopup.classList.remove('show');
        }
    });
});