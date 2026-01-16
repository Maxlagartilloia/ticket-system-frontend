// ================================
// DASHBOARD STATS - COPIERMASTER
// ================================

const API_BASE_URL = "https://ticket-system-backend-4h25.onrender.com";

// 🔐 TOKEN UNIFICADO (REGLA ABSOLUTA)
const token = localStorage.getItem("copiermaster_token");
const role = localStorage.getItem("copiermaster_role");

// ================================
// AUTH GUARD
// ================================
if (!token) {
  window.location.href = "index.html";
}

if (!role || !["admin", "supervisor"].includes(role)) {
  alert("Access denied");
  localStorage.clear();
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
// PANEL TITLE
// ================================
const panelTitle = document.getElementById("panelTitle");
if (panelTitle) {
  panelTitle.textContent = role === "admin" ? "Admin Panel" : "Supervisor Panel";
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

    if (res.status === 401 || res.status === 403) {
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
