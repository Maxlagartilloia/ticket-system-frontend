// ================================
// DASHBOARD - COPIERMASTER
// ================================

const API_BASE_URL = "https://ticket-system-backend-4h25.onrender.com";
const token = localStorage.getItem("copiermaster_token");

if (!token) {
  window.location.href = "index.html";
}

// ================================
// NAVIGATION
// ================================

function goTo(page) {
  window.location.href = page;
}

// ================================
// LOGOUT
// ================================

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// ================================
// FETCH DASHBOARD DATA
// ================================

async function loadDashboard() {
  try {
    const ticketsRes = await fetch(`${API_BASE_URL}/tickets`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const institutionsRes = await fetch(`${API_BASE_URL}/instituciones`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!ticketsRes.ok || !institutionsRes.ok) {
      throw new Error("Unauthorized");
    }

    const tickets = await ticketsRes.json();
    const institutions = await institutionsRes.json();

    // Metrics
    const open = tickets.filter(t => t.status === "open").length;
    const progress = tickets.filter(t => t.status === "in_progress").length;

    const today = new Date().toISOString().split("T")[0];
    const resolvedToday = tickets.filter(
      t => t.status === "closed" && t.created_at?.startsWith(today)
    ).length;

    // Update UI
    document.getElementById("openTickets").textContent = open;
    document.getElementById("inProgressTickets").textContent = progress;
    document.getElementById("resolvedToday").textContent = resolvedToday;
    document.getElementById("institutionsCount").textContent = institutions.length;

  } catch (error) {
    console.error(error);
    logout();
  }
}

// ================================
// INIT
// ================================

document.addEventListener("DOMContentLoaded", loadDashboard);
