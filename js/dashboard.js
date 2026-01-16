// ================================
// DASHBOARD STATS - COPIERMASTER
// ================================

const API_BASE_URL = "https://ticket-system-backend-4h25.onrender.com";

// 🔐 TOKEN UNIFICADO
const token = localStorage.getItem("access_token");

if (!token) {
  window.location.href = "index.html";
}

// ================================
// LOGOUT
// ================================
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// ================================
// NAVIGATION
// ================================
function goTo(page) {
  window.location.href = page;
}

// ================================
// LOAD DASHBOARD STATS
// ================================
async function loadDashboardStats() {
  try {
    const res = await fetch(`${API_BASE_URL}/reportes/dashboard`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (res.status === 401) {
      localStorage.clear();
      window.location.href = "index.html";
      return;
    }

    if (!res.ok) {
      throw new Error("Failed to load dashboard stats");
    }

    const data = await res.json();

    document.getElementById("openTickets").textContent = data.open_tickets;
    document.getElementById("inProgress").textContent = data.in_progress;
    document.getElementById("resolvedToday").textContent = data.resolved_today;
    document.getElementById("institutions").textContent = data.institutions;

  } catch (error) {
    console.error("Dashboard error:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadDashboardStats);
