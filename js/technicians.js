// ================================
// TECHNICIANS - COPIERMASTER
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
const createTechnicianSection = document.getElementById("createTechnicianSection");
const actionsHeader = document.getElementById("actionsHeader");

if (panelTitle) {
  panelTitle.textContent =
    role === "admin" ? "Admin Technicians" : "Supervisor Technicians";
}

if (!["admin", "supervisor"].includes(role)) {
  if (createTechnicianSection) createTechnicianSection.style.display = "none";
  if (actionsHeader) actionsHeader.style.display = "none";
}

// ================================
// ELEMENTS
// ================================
const technicianForm = document.getElementById("technicianForm");
const techniciansTable = document.getElementById("techniciansTable");

// ================================
// LOAD TECHNICIANS
// ================================
async function loadTechnicians() {
  const res = await fetch(`${API_BASE_URL}/usuarios`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (res.status === 401 || res.status === 403) {
    logout();
    return;
  }

  const data = await res.json();

  techniciansTable.innerHTML = "";

  data
    .filter(user => user.role === "technician")
    .forEach(tech => {
      const row = document.createElement("tr");

      const actions = `
        <button onclick="deactivateTechnician(${tech.id})">Deactivate</button>
      `;

      row.innerHTML = `
        <td>${tech.id}</td>
        <td>${tech.full_name}</td>
        <td>${tech.email}</td>
        <td>${tech.is_active ? "Active" : "Inactive"}</td>
        <td>${actions}</td>
      `;

      techniciansTable.appendChild(row);
    });
}

// ================================
// CREATE TECHNICIAN
// ================================
if (technicianForm) {
  technicianForm.addEventListener("submit", async e => {
    e.preventDefault();

    const payload = {
      full_name: document.getElementById("fullName").value,
      email: document.getElementById("email").value,
      password: document.getElementById("password").value,
      role: "technician"
    };

    const res = await fetch(`${API_BASE_URL}/usuarios`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      alert("Error creating technician");
      return;
    }

    technicianForm.reset();
    await loadTechnicians();
  });
}

// ================================
// DEACTIVATE TECHNICIAN (SOFT)
// ================================
async function deactivateTechnician(id) {
  alert(
    "Deactivation flow will be implemented when user update endpoint is enabled."
  );
}

// ================================
// INIT
// ================================
document.addEventListener("DOMContentLoaded", loadTechnicians);
