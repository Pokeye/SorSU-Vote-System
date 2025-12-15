function goBack() {
  window.history.back();
}

document.getElementById("resetForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();

  if (email) {
    alert(`A reset link has been sent to ${email}`);
    window.location.href = "verifcation.html";
  } else {
    alert("Please enter your email.");
  }
});
