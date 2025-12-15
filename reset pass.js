function goBack() {
  history.back();
}
const form = document.getElementById("resetPass");

form.addEventListener("submit", function(e) {
  e.preventDefault(); 

  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }


  alert("Password reset successfully!");

  
  window.location.href = "loginn.html"; 
});
