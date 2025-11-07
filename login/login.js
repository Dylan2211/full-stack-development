// Redirect to main page upon login
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  window.location.href = "mainpage.html";
});
