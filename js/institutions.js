// ================================
// INSTITUTIONS - COPIERMASTER
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
const createInstitutionSection = document.getElementById("createInstitutionSection");
const actionsHeader = document.getElementById("actionsHeader");

if (panelTitle) {
  panelTitle.textContent = role === "admin" ? "Admin Institutions" : "Supervisor Institutions";
}

if (!["admin", "supervisor"].includes(role)) {
  if (createInstitutionSection) createInstitutionSection.style.display = "none";
}

if (!["admin", "supervisor"].includes(role)) {
  if (actionsHeader) actionsHeader.style.display = "none";
}

// ================================
// LOAD INSTITUTIONS
// ================================
async function loadInstitutions() {
  const res = await fetch(`${API_BASE_URL}/instituciones`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (res.status === 401 || res.status === 403) {
    logout();
    return;
  }

  const data = await res.json();
  const tbody = document.getElementById("institutionsTable");
  tbody.innerHTML = "";

  data.forEach(inst => {
    const row = document.createElement("tr");

    const actions = `
      <button onclick="editInstitution(${inst.id})">Edit</button>
      <button onclick="deleteInstitution(${inst.id})">Delete</button>
    `;

    row.innerHTML = `
      <td>${inst.id}</td>
      <td>${inst.name}</td>
      <td>${inst.address || "-"}</td>
      <td>${actions}</td>
    `;

    tbody.appendChild(row);
  });
}

// ================================
// CREATE INSTITUTION
// ================================
const institutionForm = document.getElementById("institutionForm");

if (institutionForm) {
  institutionForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      name: document.getElementById("name").value,
      address: document.getElementById("address").value
    };

    const res = await fetch(`${API_BASE_URL}/instituciones`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      alert("Error creating institution");
      return;
    }

    institutionForm.reset();
    await loadInstitutions();
  });
}

// ================================
// PLACEHOLDER ACTIONS (NEXT STEP)
// ================================
function editInstitution(id) {
  alert(`Edit institution ${id} - flow will be implemented next.`);
}

async function deleteInstitution(id) {
  if (!confirm("Are you sure you want to delete this institution?")) return;

  const res = await fetch(`${API_BASE_URL}/instituciones/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    alert("Error deleting institution");
    return;
  }

  await loadInstitutions();
}

// ================================
// INIT
// ================================
document.addEventListener("DOMContentLoaded", loadInstitutions);
