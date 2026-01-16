// ================================
// INSTITUTIONS - COPIERMASTER
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
// LOAD INSTITUTIONS
// ================================

async function loadInstitutions() {
  const res = await fetch(`${API_BASE_URL}/instituciones`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();
  const tbody = document.getElementById("institutionsTable");
  tbody.innerHTML = "";

  data.forEach(inst => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${inst.id}</td>
      <td>${inst.name}</td>
      <td>${inst.address || "-"}</td>
    `;
    tbody.appendChild(row);
  });
}

// ================================
// CREATE INSTITUTION
// ================================

document.getElementById("institutionForm").addEventListener("submit", async (e) => {
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

  document.getElementById("institutionForm").reset();
  await loadInstitutions();
});

// ================================
// INIT
// ================================

document.addEventListener("DOMContentLoaded", loadInstitutions);
