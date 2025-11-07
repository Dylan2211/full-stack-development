// Redirect to profile page when "My Profile" is clicked
document.addEventListener("DOMContentLoaded", () => {
  const profileBtn = document.querySelector(".my-profile");
  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      window.location.href = "profile.html";
    });
  }
});
