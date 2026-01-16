// ================================
// TICKETS - COPIERMASTER
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
// LOAD TICKETS
// ================================

async function loadTickets() {
  const res = await fetch(`${API_BASE_URL}/tickets`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const tickets = await res.json();
  const tbody = document.getElementById("ticketsTable");
  tbody.innerHTML = "";

  tickets.forEach(ticket => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${ticket.id}</td>
      <td>${ticket.institution_id}</td>
      <td>${ticket.status}</td>
      <td>${ticket.priority}</td>
      <td>${new Date(ticket.created_at).toLocaleString()}</td>
    `;

    tbody.appendChild(row);
  });
}

// ================================
// CREATE TICKET
// ================================

document.getElementById("ticketForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    institution_id: Number(document.getElementById("institution_id").value),
    equipment: document.getElementById("equipment").value,
    description: document.getElementById("description").value,
    priority: document.getElementById("priority").value
  };

  const res = await fetch(`${API_BASE_URL}/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    alert("Error creating ticket");
    return;
  }

  document.getElementById("ticketForm").reset();
  await loadTickets();
});

// ================================
// INIT
// ================================

document.addEventListener("DOMContentLoaded", loadTickets);
