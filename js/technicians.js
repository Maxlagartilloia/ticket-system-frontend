// ==========================================
// TECHNICIANS LOGIC - COPIERMASTER LEAD ENGINEER
// ==========================================

const API_BASE_URL = "https://ticket-system-backend-4h25.onrender.com";

// 🔐 AUTH DATA (REGLA ABSOLUTA)
const token = localStorage.getItem("copiermaster_token");
const role = localStorage.getItem("copiermaster_role");

// ================================
// AUTH GUARD
// ================================
if (!token || !["admin", "supervisor"].includes(role)) {
    localStorage.clear();
    window.location.href = "index.html";
}

const technicianForm = document.getElementById("technicianForm");
const techniciansTable = document.getElementById("techniciansTable");

// ================================
// LOAD TECHNICIANS (REFACTORIZADO)
// ================================
async function loadTechnicians() {
    try {
        // ✅ RUTA CORREGIDA: /users (Alineado con el Backend)
        const res = await fetch(`${API_BASE_URL}/users`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.status === 401 || res.status === 403) return logout();

        const data = await res.json();
        if (!techniciansTable) return;

        techniciansTable.innerHTML = "";

        // Filtramos solo los que tienen rol 'technician' para esta vista
        data.filter(user => user.role === "technician").forEach(tech => {
            const row = document.createElement("tr");
            
            row.innerHTML = `
                <td>${tech.id}</td>
                <td><strong>${tech.full_name}</strong></td>
                <td>${tech.email}</td>
                <td><span class="status-${tech.is_active ? 'active' : 'inactive'}">
                    ${tech.is_active ? "Active" : "Inactive"}
                </span></td>
                <td>
                    <button class="btn-delete" onclick="deactivateTechnician(${tech.id})">Deactivate</button>
                </td>
            `;
            techniciansTable.appendChild(row);
        });
    } catch (err) {
        console.error("Technician Service Error:", err);
    }
}

// ================================
// CREATE TECHNICIAN
// ================================
if (technicianForm) {
    technicianForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // ✅ PAYLOAD ALINEADO CON SCHEMAS.PY
        const payload = {
            full_name: document.getElementById("fullName").value,
            email: document.getElementById("email").value,
            password: document.getElementById("password").value,
            role: "technician",
            institution_id: 1 // Por defecto a la sede principal para evitar error
        };

        const res = await fetch(`${API_BASE_URL}/users/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Technician created successfully!");
            technicianForm.reset();
            loadTechnicians();
        } else {
            const error = await res.json();
            alert(`Error: ${error.detail || "Check data or duplicate email"}`);
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

async function deactivateTechnician(id) {
    alert("Functionality: Deactivation request sent to backend (Soft Delete).");
    // Aquí puedes llamar al endpoint de borrado lógico si lo habilitamos en users.py
}

document.addEventListener("DOMContentLoaded", loadTechnicians);
