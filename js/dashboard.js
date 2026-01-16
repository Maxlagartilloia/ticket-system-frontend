// ==========================================
// DASHBOARD LOGIC - COPIERMASTER LEAD ENGINEER
// ==========================================

const API_BASE_URL = "https://ticket-system-backend-4h25.onrender.com";

// 🔐 RECUPERACIÓN DE SESIÓN (REGLA ABSOLUTA)
const token = localStorage.getItem("copiermaster_token");
const role = localStorage.getItem("copiermaster_role");

// ================================
// AUTH GUARD - PROTECCIÓN DE RUTA
// ================================
function checkAuth() {
    if (!token) {
        window.location.href = "index.html";
        return;
    }

    // Solo admin y supervisor pueden ver las métricas globales
    const privilegedRoles = ["admin", "supervisor"];
    if (!privilegedRoles.includes(role)) {
        alert("Access Denied: Administrative privileges required.");
        window.location.href = "technician_dashboard.html"; // O tu página por defecto
    }
}

// ================================
// UI UPDATES
// ================================
function updateUI() {
    const panelTitle = document.getElementById("panelTitle");
    const userRoleDisplay = document.getElementById("userRoleDisplay");

    if (panelTitle) {
        panelTitle.textContent = role === "admin" ? "Administrator Panel" : "Supervisor Panel";
    }
    if (userRoleDisplay) {
        const email = localStorage.getItem("copiermaster_user");
        userRoleDisplay.textContent = email ? `User: ${email}` : role.toUpperCase();
    }
}

// ================================
// LOAD DASHBOARD STATS (REAL-TIME)
// ================================
async function loadDashboardStats() {
    try {
        // ✅ RUTA SINCRONIZADA CON EL BACKEND REFACTORIZADO
        const res = await fetch(`${API_BASE_URL}/reports/stats`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        // Manejo de expiración de token
        if (res.status === 401 || res.status === 403) {
            handleLogout();
            return;
        }

        if (!res.ok) throw new Error("Dashboard stats fetch failed");

        const data = await res.json();

        // Actualización de contadores en el HTML
        document.getElementById("openTickets").textContent = data.open_tickets || 0;
        document.getElementById("inProgress").textContent = data.in_progress || 0;
        // Nota: El backend envía 'total_institutions', lo mapeamos a tu UI
        document.getElementById("institutions").textContent = data.total_institutions || 0;
        // Puedes añadir 'total_users' si tu HTML tiene el ID
        const usersElement = document.getElementById("totalUsers");
        if (usersElement) usersElement.textContent = data.total_users || 0;

    } catch (error) {
        console.error("Dashboard Service Error:", error);
    }
}

// ================================
// UTILITIES
// ================================
function handleLogout() {
    localStorage.removeItem("copiermaster_token");
    localStorage.removeItem("copiermaster_role");
    localStorage.removeItem("copiermaster_user");
    window.location.href = "index.html";
}

function goTo(page) {
    window.location.href = page;
}

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    updateUI();
    loadDashboardStats();
});
