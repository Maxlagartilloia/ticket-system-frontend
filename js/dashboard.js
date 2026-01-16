// ================================
// DASHBOARD STATS - COPIERMASTER
// ================================

const API_BASE_URL = "https://ticket-system-backend-4h25.onrender.com";
const token = localStorage.getItem("copiermaster_token");

if (!token) {
  window.location.href = "index.html";
}

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

function goTo(page) {
  window.location.href = page;
}

async function loadDashboardStats() {
  const res = await fetch(`${API_BASE_URL}/reportes/dashboard`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    console.error("Failed to load dashboard stats");
    return;
  }

  const data = await res.json();

  document.getElementById("openTickets").textContent = data.open_tickets;
  document.getElementById("inProgress").textContent = data.in_progress;
  document.getElementById("resolvedToday").textContent = data.resolved_today;
  document.getElementById("institutions").textContent = data.institutions;
}

document.addEventListener("DOMContentLoaded", loadDashboardStats);
