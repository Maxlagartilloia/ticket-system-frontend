// ================================
// DEPARTMENTS - COPIERMASTER
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
const createDepartmentSection = document.getElementById("createDepartmentSection");
const actionsHeader = document.getElementById("actionsHeader");

if (panelTitle) {
  panelTitle.textContent =
    role === "admin" ? "Admin Departments" : "Supervisor Departments";
}

if (!["admin", "supervisor"].includes(role)) {
  if (createDepartmentSection) createDepartmentSection.style.display = "none";
  if (actionsHeader) actionsHeader.style.display = "none";
}

// ================================
// ELEMENTS
// ================================
const institutionSelect = document.getElementById("institutionSelect");
const departmentsTable = document.getElementById("departmentsTable");
const departmentForm = document.getElementById("departmentForm");

// ================================
// LOAD INSTITUTIONS (FOR SELECT)
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
  institutionSelect.innerHTML = `<option value="">Select Institution</option>`;

  data.forEach(inst => {
    const option = document.createElement("option");
    option.value = inst.id;
    option.textContent = inst.name;
    institutionSelect.appendChild(option);
  });
}

// ================================
// LOAD DEPARTMENTS (BY INSTITUTION)
// ================================
async function loadDepartments(institutionId = null) {
  departmentsTable.innerHTML = "";

  let url = `${API_BASE_URL}/departments`;
  if (institutionId) {
    url = `${API_BASE_URL}/departments/institution/${institutionId}`;
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (res.status === 401 || res.status === 403) {
    logout();
    return;
  }

  const data = await res.json();

  data.forEach(dep => {
    const row = document.createElement("tr");

    const actions = `
      <button onclick="deleteDepartment(${dep.id})">Delete</button>
    `;

    row.innerHTML = `
      <td>${dep.id}</td>
      <td>${dep.name}</td>
      <td>${dep.institution_id}</td>
      <td>${actions}</td>
    `;

    departmentsTable.appendChild(row);
  });
}

// ================================
// EVENTS
// ================================
institutionSelect.addEventListener("change", e => {
  if (e.target.value) {
    loadDepartments(e.target.value);
  } else {
    loadDepartments();
  }
});

// ================================
// CREATE DEPARTMENT
// ================================
if (departmentForm) {
  departmentForm.addEventListener("submit", async e => {
    e.preventDefault();

    const payload = {
      name: document.getElementById("name").value,
      institution_id: institutionSelect.value
    };

    const res = await fetch(`${API_BASE_URL}/departments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      alert("Error creating department");
      return;
    }

    departmentForm.reset();
    await loadDepartments(payload.institution_id);
  });
}

// ================================
// DELETE DEPARTMENT
// ================================
async function deleteDepartment(id) {
  if (!confirm("Are you sure you want to delete this department?")) return;

  const res = await fetch(`${API_BASE_URL}/departments/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    alert("Error deleting department");
    return;
  }

  await loadDepartments(institutionSelect.value || null);
}

// ================================
// INIT
// ================================
document.addEventListener("DOMContentLoaded", async () => {
  await loadInstitutions();
  await loadDepartments();
});
