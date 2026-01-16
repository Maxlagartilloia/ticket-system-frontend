// ================================
// REPORTS (DASHBOARD METRICS) - COPIERMASTER
// ================================

const API_BASE_URL = "https://ticket-system-backend-4h25.onrender.com";

// 🔐 AUTH DATA (REGLA ABSOLUTA)
const token = localStorage.getItem("copiermaster_token");
const role = localStorage.getItem("copiermaster_role");

// ================================
// AUTH GUARD
// ================================
if (!token) {
  window.location.href = "index.html";
}

if (!role || !["admin", "supervisor"].includes(role)) {
  localStorage.clear();
  window.location.href = "index.html";
}

// ================================
// NAVIGATION
// ================================
function goTo(page) {
  window.location.href = page;
}

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// ================================
// UI BY ROLE
// ================================
const panelTitle = document.getElementById("panelTitle");
if (panelTitle) {
  panelTitle.textContent = role === "admin" ? "Admin Reports" : "Supervisor Reports";
}

// ================================
// HELPERS
// ================================
function safeSetText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(value ?? 0);
}

// ================================
// LOAD REPORT METRICS
// ================================
async function loadReportMetrics() {
  try {
    const res = await fetch(`${API_BASE_URL}/reportes/dashboard`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // 🔒 Session invalid or forbidden
    if (res.status === 401 || res.status === 403) {
      logout();
      return;
    }

    if (!res.ok) {
      throw new Error(`Failed to load reports metrics (${res.status})`);
    }

    const data = await res.json();

    // Backend returns:
    // open_tickets, in_progress, resolved_today, institutions
    safeSetText("openTickets", data.open_tickets);
    safeSetText("inProgress", data.in_progress);
    safeSetText("resolvedToday", data.resolved_today);
    safeSetText("institutions", data.institutions);

  } catch (err) {
    console.error("Reports error:", err);
    // No UI extra required; keep metrics as-is.
  }
}

// ================================
// INIT
// ================================
document.addEventListener("DOMContentLoaded", loadReportMetrics);
