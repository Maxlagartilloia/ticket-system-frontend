// ================================
// TICKETS FLOW - COPIERMASTER
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

if (!role || !["admin", "supervisor", "technician", "client"].includes(role)) {
  localStorage.clear();
  window.location.href = "index.html";
}

// ================================
// NAV
// ================================
function goTo(page) {
  window.location.href = page;
}

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// ================================
// ELEMENTS
// ================================
const institutionSelect = document.getElementById("institutionSelect");
const departmentSelect = document.getElementById("departmentSelect");
const equipmentSelect = document.getElementById("equipmentSelect");
const ticketsTable = document.getElementById("ticketsTable");
const form = document.getElementById("ticketForm");
const createTicketSection = document.getElementById("createTicketSection");
const panelTitle = document.getElementById("panelTitle");
const actionsHeader = document.getElementById("actionsHeader");

// ================================
// UI BY ROLE
// ================================
if (panelTitle) {
  if (role === "admin") panelTitle.textContent = "Admin Tickets";
  else if (role === "supervisor") panelTitle.textContent = "Supervisor Tickets";
  else if (role === "technician") panelTitle.textContent = "Technician Tickets";
  else panelTitle.textContent = "My Tickets";
}

// Solo CLIENT puede crear tickets
if (role !== "client") {
  if (createTicketSection) createTicketSection.style.display = "none";
}

// Acciones solo para supervisor / technician
if (!["supervisor", "technician"].includes(role)) {
  if (actionsHeader) actionsHeader.style.display = "none";
}

// ================================
// LOAD INSTITUTIONS (CLIENT ONLY)
// ================================
async function loadInstitutions() {
  if (role !== "client") return;

  const res = await fetch(`${API_BASE_URL}/instituciones`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (res.status === 401 || res.status === 403) {
    logout();
    return;
  }

  const data = await res.json();

  institutionSelect.innerHTML = "";
  data.forEach(inst => {
    const opt = document.createElement("option");
    opt.value = inst.id;
    opt.textContent = inst.name;
    institutionSelect.appendChild(opt);
  });

  if (data.length) {
    loadDepartments(data[0].id);
  }
}

// ================================
// LOAD DEPARTMENTS
// ================================
async function loadDepartments(institutionId) {
  const res = await fetch(`${API_BASE_URL}/departments/institution/${institutionId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) return;

  const data = await res.json();

  departmentSelect.innerHTML = "";
  equipmentSelect.innerHTML = "";

  data.forEach(dep => {
    const opt = document.createElement("option");
    opt.value = dep.id;
    opt.textContent = dep.name;
    departmentSelect.appendChild(opt);
  });

  if (data.length) {
    loadEquipment(data[0].id);
  }
}

// ================================
// LOAD EQUIPMENT
// ================================
async function loadEquipment(departmentId) {
  const res = await fetch(`${API_BASE_URL}/equipment/department/${departmentId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) return;

  const data = await res.json();

  equipmentSelect.innerHTML = "";
  data.forEach(eq => {
    const opt = document.createElement("option");
    opt.value = eq.id;
    opt.textContent = eq.name;
    equipmentSelect.appendChild(opt);
  });
}

// ================================
// EVENTS (CLIENT ONLY)
// ================================
if (role === "client") {
  institutionSelect.addEventListener("change", e => {
    loadDepartments(e.target.value);
  });

  departmentSelect.addEventListener("change", e => {
    loadEquipment(e.target.value);
  });

  // ================================
  // CREATE TICKET
  // ================================
  form.addEventListener("submit", async e => {
    e.preventDefault();

    const payload = {
      title: document.getElementById("title").value,
      description: document.getElementById("description").value,
      priority: document.getElementById("priority").value,
      institution_id: institutionSelect.value,
      equipment_id: equipmentSelect.value || null
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

    form.reset();
    await loadTickets();
  });
}

// ================================
// LOAD TICKETS (ALL ROLES)
// ================================
async function loadTickets() {
  const res = await fetch(`${API_BASE_URL}/tickets`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (res.status === 401 || res.status === 403) {
    logout();
    return;
  }

  const data = await res.json();

  ticketsTable.innerHTML = "";

  data.forEach(t => {
    const row = document.createElement("tr");

    let actions = "";
    if (role === "technician") {
      actions = `<button onclick="changeStatus(${t.id})">Change Status</button>`;
    }
    if (role === "supervisor") {
      actions = `<button onclick="assignTechnician(${t.id})">Assign</button>`;
    }

    row.innerHTML = `
      <td>${t.id}</td>
      <td>${t.title}</td>
      <td>${t.status}</td>
      <td>${t.priority}</td>
      <td>${t.institution_id}</td>
      ${["supervisor", "technician"].includes(role) ? `<td>${actions}</td>` : ""}
    `;

    ticketsTable.appendChild(row);
  });
}

// ================================
// PLACEHOLDER ACTIONS (NEXT STEP)
// ================================
function assignTechnician(ticketId) {
  alert("Assign technician flow will be implemented next.");
}

function changeStatus(ticketId) {
  alert("Change status flow will be implemented next.");
}

// ================================
// INIT
// ================================
document.addEventListener("DOMContentLoaded", async () => {
  await loadInstitutions();
  await loadTickets();
});
