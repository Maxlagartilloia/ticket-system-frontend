// Protect dashboard
const token = localStorage.getItem("copiermaster_token");

if (!token) {
  window.location.href = "index.html";
}

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("copiermaster_token");
  window.location.href = "index.html";
});
