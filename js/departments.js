// ================================
// DEPARTMENTS - COPIERMASTER
// ================================

const API_BASE_URL = "https://ticket-system-backend-4h25.onrender.com";
const token = localStorage.getItem("copiermaster_token");

if (!token) {
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
// LOAD INSTITUTIONS
// ================================

async function loadInstitutions() {
  const res = await fetch(`${API_BASE_URL}/instituciones`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const institutions = await res.json();
  const select = document.getElementById("institutionSelect");
  select.innerHTML = "";

  institutions.forEach(inst => {
    const option = document.createElement("option");
    option.value = inst.id;
    option.textContent = inst.name;
    select.appendChild(option);
  });
}

// ================================
// LOAD DEPARTMENTS
// ================================

async function loadDepartments() {
  const res = await fetch(`${API_BASE_URL}/departments`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  const tbody = document.getElementById("departmentsTable");
  tbody.innerHTML = "";

  data.forEach(dep => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${dep.id}</td>
      <td>${dep.name}</td>
      <td>${dep.institution_name}</td>
    `;
    tbody.appendChild(row);
  });
}

// ================================
// CREATE DEPARTMENT
// ================================

document.getElementById("departmentForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    name: document.getElementById("departmentName").value,
    institution_id: document.getElementById("institutionSelect").value
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

  document.getElementById("departmentForm").reset();
  await loadDepartments();
});

// ================================
// INIT
// ================================

document.addEventListener("DOMContentLoaded", async () => {
  await loadInstitutions();
  await loadDepartments();
});
