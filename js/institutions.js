// ==========================================
// INSTITUTIONS LOGIC - COPIERMASTER LEAD ENGINEER
// ==========================================

const API_BASE_URL = "https://ticket-system-backend-4h25.onrender.com";

// 🔐 AUTH DATA (REGLA ABSOLUTA)
const token = localStorage.getItem("copiermaster_token");
const role = localStorage.getItem("copiermaster_role");

// ================================
// AUTH GUARD - PROTECCIÓN DE RUTA
// ================================
if (!token || !["admin", "supervisor"].includes(role)) {
    localStorage.clear();
    window.location.href = "index.html";
}

// ================================
// UI ELEMENTS
// ================================
const institutionsTable = document.getElementById("institutionsTable");
const institutionForm = document.getElementById("institutionForm");
const panelTitle = document.getElementById("panelTitle");

if (panelTitle) {
    panelTitle.textContent = role === "admin" ? "Admin: Client Management" : "Supervisor: Client Management";
}

// ================================
// LOAD INSTITUTIONS (REFACTORIZADO)
// ================================
async function loadInstitutions() {
    try {
        // ✅ RUTA CORREGIDA: /institutions (Alineado con el Backend)
        const res = await fetch(`${API_BASE_URL}/institutions`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (res.status === 401 || res.status === 403) return handleLogout();
        
        const data = await res.json();
        if (!institutionsTable) return;

        institutionsTable.innerHTML = "";
        data.forEach(inst => {
            const row = document.createElement("tr");

            // Acciones profesionales: Edit y Soft Delete
            const actions = `
                <div class="table-actions">
                    <button class="btn-edit" onclick="editInstitution(${inst.id})">Edit</button>
                    <button class="btn-delete" onclick="deleteInstitution(${inst.id})">Delete</button>
                </div>
            `;

            row.innerHTML = `
                <td>${inst.id}</td>
                <td><strong>${inst.name}</strong></td>
                <td>${inst.address || "-"}</td>
                <td>${inst.phone || "-"}</td>
                <td>${actions}</td>
            `;

            institutionsTable.appendChild(row);
        });
    } catch (err) {
        console.error("Institution Service Error:", err);
    }
}

// ================================
// CREATE INSTITUTION
// ================================
if (institutionForm) {
    institutionForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const payload = {
            name: document.getElementById("name").value,
            address: document.getElementById("address").value,
            phone: document.getElementById("phone") ? document.getElementById("phone").value : ""
        };

        try {
            const res = await fetch(`${API_BASE_URL}/institutions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Institution registered successfully!");
                institutionForm.reset();
                loadInstitutions();
            } else {
                const error = await res.json();
                alert(`Error: ${error.detail || "Could not create institution"}`);
            }
        } catch (err) {
            alert("Network error. Check server status.");
        }
    });
}

// ================================
// DELETE (SOFT DELETE)
// ================================
async function deleteInstitution(id) {
    if (!confirm("Are you sure you want to deactivate this institution?")) return;

    try {
        const res = await fetch(`${API_BASE_URL}/institutions/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (res.ok) {
            loadInstitutions();
        } else {
            alert("Failed to delete. Ensure no active tickets are linked.");
        }
    } catch (err) {
        console.error("Delete error:", err);
    }
}

// ================================
// UTILS
// ================================
function editInstitution(id) {
    alert("Edit mode: Fetching institution data... (Implementation in progress)");
}

function handleLogout() {
    localStorage.clear();
    window.location.href = "index.html";
}

function goTo(page) {
    window.location.href = page;
}

// INIT
document.addEventListener("DOMContentLoaded", loadInstitutions);
