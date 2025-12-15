// Go back function
function goBack() {
  window.history.back();
}

// Auto focus next input
const codes = document.querySelectorAll('.code');
codes.forEach((input, index) => {
  input.addEventListener('input', () => {
    if (input.value.length === 1 && index < codes.length - 1) {
      codes[index + 1].focus();
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !input.value && index > 0) {
      codes[index - 1].focus();
    }
  });
});

// Simulate verification
function verifyCode() {
  const enteredCode = Array.from(codes).map(i => i.value).join('');
  if (enteredCode.length < 4) {
    alert('Please enter the complete code.');
    return false;
  } else {
    alert(`Code entered: ${enteredCode}`);
    return true;
  }
}

const verifyForm = document.getElementById('verifyForm');
if (verifyForm) {
  verifyForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (verifyCode()) {
      window.location.href = 'reset pass.html';
    }
  });
}
