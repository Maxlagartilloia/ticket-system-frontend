// ==========================================
// EQUIPMENT LOGIC - COPIERMASTER LEAD ENGINEER
// ==========================================

const API_BASE_URL = "https://ticket-system-backend-4h25.onrender.com";

// 🔐 AUTH DATA (REGLA ABSOLUTA)
const token = localStorage.getItem("copiermaster_token");
const role = localStorage.getItem("copiermaster_role");

// ================================
// AUTH GUARD
// ================================
if (!token || !["admin", "supervisor"].includes(role)) {
    window.location.href = "index.html";
}

// ================================
// ELEMENTS
// ================================
const institutionSelect = document.getElementById("institutionSelect");
const departmentSelect = document.getElementById("departmentSelect");
const equipmentTable = document.getElementById("equipmentTable");
const equipmentForm = document.getElementById("equipmentForm");

// ================================
// LOAD INSTITUTIONS (REFACTORIZADO)
// ================================
async function loadInstitutions() {
    try {
        // ✅ RUTA CORREGIDA: /institutions
        const res = await fetch(`${API_BASE_URL}/institutions`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.status === 401) return logout();
        
        const data = await res.json();
        if (!institutionSelect) return;

        institutionSelect.innerHTML = '<option value="">Select Institution</option>';
        data.forEach(inst => {
            const opt = document.createElement("option");
            opt.value = inst.id;
            opt.textContent = inst.name;
            institutionSelect.appendChild(opt);
        });
    } catch (err) {
        console.error("Error loading institutions:", err);
    }
}

// ================================
// LOAD DEPARTMENTS
// ================================
async function loadDepartments(institutionId) {
    if (!institutionId) return;
    try {
        const res = await fetch(`${API_BASE_URL}/departments/institution/${institutionId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        
        departmentSelect.innerHTML = '<option value="">Select Department</option>';
        equipmentTable.innerHTML = "";

        data.forEach(dep => {
            const opt = document.createElement("option");
            opt.value = dep.id;
            opt.textContent = dep.name;
            departmentSelect.appendChild(opt);
        });
    } catch (err) {
        console.error("Error loading departments:", err);
    }
}

// ================================
// LOAD EQUIPMENT
// ================================
async function loadEquipment(departmentId) {
    if (!departmentId) return;
    try {
        const res = await fetch(`${API_BASE_URL}/equipment/department/${departmentId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();

        equipmentTable.innerHTML = "";
        data.forEach(eq => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>#${eq.id}</td>
                <td><strong>${eq.name}</strong></td>
                <td>${eq.model || "-"}</td>
                <td>${eq.serial_number || "-"}</td>
                <td><button class="btn-delete" onclick="alert('Feature coming soon')">Delete</button></td>
            `;
            equipmentTable.appendChild(row);
        });
    } catch (err) {
        console.error("Error loading equipment:", err);
    }
}

// ================================
// EVENTS
// ================================
if (institutionSelect) {
    institutionSelect.addEventListener("change", e => loadDepartments(e.target.value));
}

if (departmentSelect) {
    departmentSelect.addEventListener("change", e => loadEquipment(e.target.value));
}

// ================================
// CREATE EQUIPMENT
// ================================
if (equipmentForm) {
    equipmentForm.addEventListener("submit", async e => {
        e.preventDefault();

        const payload = {
            name: document.getElementById("name").value,
            model: document.getElementById("model").value,
            serial_number: document.getElementById("serial_number").value,
            department_id: parseInt(departmentSelect.value) // ✅ Entero obligatorio
        };

        const res = await fetch(`${API_BASE_URL}/equipment/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Equipment registered successfully!");
            equipmentForm.reset();
            loadEquipment(departmentSelect.value);
        } else {
            const error = await res.json();
            alert(`Error: ${error.detail || "Check input data"}`);
        }
    });
}

// ================================
// UTILS
// ================================
function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

function goTo(page) { window.location.href = page; }

document.addEventListener("DOMContentLoaded", loadInstitutions);
