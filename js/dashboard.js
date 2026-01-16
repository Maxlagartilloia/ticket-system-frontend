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

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// ================================
// LOAD DASHBOARD STATS
// ================================

async function loadStats() {
  const res = await fetch(`${API_BASE_URL}/reportes/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  document.getElementById("openTickets").textContent = data.open_tickets;
  document.getElementById("inProgress").textContent = data.in_progress;
  document.getElementById("resolvedToday").textContent = data.resolved_today;
  document.getElementById("institutions").textContent = data.institutions;
}

// ================================
// LOAD RECENT TICKETS
// ================================

async function loadRecentTickets() {
  const res = await fetch(`${API_BASE_URL}/tickets`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const tickets = await res.json();
  const tbody = document.getElementById("recentTickets");
  tbody.innerHTML = "";

  tickets.slice(0, 5).forEach(ticket => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${ticket.id}</td>
      <td>${ticket.institution_id}</td>
      <td>${ticket.status}</td>
      <td>${ticket.priority}</td>
      <td>${new Date(ticket.created_at).toLocaleDateString()}</td>
    `;

    tbody.appendChild(row);
  });
}

// ================================
// INIT
// ================================

document.addEventListener("DOMContentLoaded", async () => {
  await loadStats();
  await loadRecentTickets();
});
