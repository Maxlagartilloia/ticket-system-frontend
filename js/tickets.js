// ==========================================
// TICKETS LOGIC - COPIERMASTER LEAD ENGINEER
// ==========================================

const API_BASE_URL = "https://ticket-system-backend-4h25.onrender.com";

// 🔐 AUTH DATA (REGLA ABSOLUTA)
const token = localStorage.getItem("copiermaster_token");
const role = localStorage.getItem("copiermaster_role");

// ================================
// AUTH GUARD & INITIALIZATION
// ================================
if (!token || !role) {
    window.location.href = "index.html";
}

// ================================
// UI ELEMENTS
// ================================
const institutionSelect = document.getElementById("institutionSelect");
const departmentSelect = document.getElementById("departmentSelect");
const equipmentSelect = document.getElementById("equipmentSelect");
const ticketsTable = document.getElementById("ticketsTable");
const ticketForm = document.getElementById("ticketForm");

// ================================
// LOAD INSTITUTIONS (REFACTORIZADO)
// ================================
async function loadInstitutions() {
    if (role !== "client") return;

    try {
        // ✅ RUTA CORREGIDA: /institutions (No /instituciones)
        const res = await fetch(`${API_BASE_URL}/institutions`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.status === 401) return handleLogout();
        
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
// LOAD DEPARTMENTS & EQUIPMENT
// ================================
async function loadDepartments(instId) {
    if (!instId) return;
    const res = await fetch(`${API_BASE_URL}/departments/institution/${instId}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    departmentSelect.innerHTML = '<option value="">Select Department</option>';
    data.forEach(d => {
        const opt = document.createElement("option");
        opt.value = d.id;
        opt.textContent = d.name;
        departmentSelect.appendChild(opt);
    });
}

async function loadEquipment(deptId) {
    if (!deptId) return;
    const res = await fetch(`${API_BASE_URL}/equipment/department/${deptId}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    equipmentSelect.innerHTML = '<option value="">Select Equipment</option>';
    data.forEach(e => {
        const opt = document.createElement("option");
        opt.value = e.id;
        opt.textContent = `${e.name} (${e.model})`;
        equipmentSelect.appendChild(opt);
    });
}

// ================================
// TICKETS MANAGEMENT
// ================================
async function loadTickets() {
    try {
        const res = await fetch(`${API_BASE_URL}/tickets`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const tickets = await res.json();
        
        if (!ticketsTable) return;
        ticketsTable.innerHTML = "";

        tickets.forEach(t => {
            const row = document.createElement("tr");
            
            // Lógica de acciones dinámicas por rol
            let actionBtn = "";
            if (role === "supervisor" && t.status === "open") {
                actionBtn = `<button class="btn-action" onclick="assignFlow(${t.id})">Assign</button>`;
            } else if (role === "technician" && t.status === "in_progress") {
                actionBtn = `<button class="btn-action" onclick="statusFlow(${t.id}, 'closed')">Close</button>`;
            }

            row.innerHTML = `
                <td>#${t.id}</td>
                <td>${t.title}</td>
                <td><span class="status-${t.status}">${t.status.toUpperCase()}</span></td>
                <td>${t.priority}</td>
                <td>${actionBtn}</td>
            `;
            ticketsTable.appendChild(row);
        });
    } catch (err) {
        console.error("Error loading tickets:", err);
    }
}

// ================================
// CREATE TICKET (POST)
// ================================
if (ticketForm) {
    ticketForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            title: document.getElementById("title").value,
            description: document.getElementById("description").value,
            priority: document.getElementById("priority").value,
            institution_id: parseInt(institutionSelect.value),
            equipment_id: equipmentSelect.value ? parseInt(equipmentSelect.value) : null
        };

        const res = await fetch(`${API_BASE_URL}/tickets`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Ticket created successfully!");
            ticketForm.reset();
            loadTickets();
        } else {
            alert("Failed to create ticket");
        }
    });
}

// ================================
// UTILS
// ================================
function handleLogout() {
    localStorage.clear();
    window.location.href = "index.html";
}

// Listeners para selectores jerárquicos
if (institutionSelect) institutionSelect.addEventListener("change", (e) => loadDepartments(e.target.value));
if (departmentSelect) departmentSelect.addEventListener("change", (e) => loadEquipment(e.target.value));

document.addEventListener("DOMContentLoaded", () => {
    loadInstitutions();
    loadTickets();
});
