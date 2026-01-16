// ================================
// EQUIPMENT - COPIERMASTER
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
// ELEMENTS
// ================================

const institutionSelect = document.getElementById("institutionSelect");
const departmentSelect = document.getElementById("departmentSelect");
const equipmentTable = document.getElementById("equipmentTable");
const form = document.getElementById("equipmentForm");

// ================================
// LOAD INSTITUTIONS
// ================================

async function loadInstitutions() {
  const res = await fetch(`${API_BASE_URL}/instituciones`, {
    headers: { Authorization: `Bearer ${token}` }
  });
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
  const data = await res.json();

  departmentSelect.innerHTML = "";
  equipmentTable.innerHTML = "";

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
  const data = await res.json();

  equipmentTable.innerHTML = "";
  data.forEach(eq => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${eq.id}</td>
      <td>${eq.name}</td>
      <td>${eq.model || "-"}</td>
      <td>${eq.serial_number || "-"}</td>
      <td>${departmentSelect.options[departmentSelect.selectedIndex].text}</td>
    `;
    equipmentTable.appendChild(row);
  });
}

// ================================
// EVENTS
// ================================

institutionSelect.addEventListener("change", e => {
  loadDepartments(e.target.value);
});

departmentSelect.addEventListener("change", e => {
  loadEquipment(e.target.value);
});

// ================================
// CREATE EQUIPMENT
// ================================

form.addEventListener("submit", async e => {
  e.preventDefault();

  const payload = {
    name: document.getElementById("name").value,
    model: document.getElementById("model").value,
    serial_number: document.getElementById("serial_number").value,
    department_id: departmentSelect.value
  };

  const res = await fetch(`${API_BASE_URL}/equipment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    alert("Error creating equipment");
    return;
  }

  form.reset();
  await loadEquipment(departmentSelect.value);
});

// ================================
// INIT
// ================================

document.addEventListener("DOMContentLoaded", async () => {
  await loadInstitutions();
});
