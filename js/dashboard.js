// ================================
// DASHBOARD SUPERVISOR - COPIERMASTER
// ================================

const API_BASE_URL = "https://ticket-system-backend-4h25.onrender.com";
const token = localStorage.getItem("copiermaster_token");
const role = localStorage.getItem("copiermaster_role");

// ================================
// PROTECCIÓN DE ACCESO
// ================================
if (!token || (role !== "supervisor" && role !== "admin")) {
    window.location.href = "/index.html";
}

// ================================
// LOGOUT
// ================================
const logoutBtn = document.querySelector(".logout-btn");
logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "/index.html";
});

// ================================
// CARGAR MÉTRICAS
// ================================
async function cargarMetricas() {
    try {
        const response = await fetch(`${API_BASE_URL}/tickets/metricas`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Error al cargar métricas");
        }

        const data = await response.json();

        document.querySelectorAll(".metric-number")[0].textContent = data.abiertos;
        document.querySelectorAll(".metric-number")[1].textContent = data.en_proceso;
        document.querySelectorAll(".metric-number")[2].textContent = data.resueltos_hoy;
        document.querySelectorAll(".metric-number")[3].textContent = data.instituciones;

    } catch (error) {
        console.error("Error métricas:", error);
    }
}

// ================================
// CARGAR TICKETS RECIENTES
// ================================
async function cargarTickets() {
    try {
        const response = await fetch(`${API_BASE_URL}/tickets?limit=10`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Error al cargar tickets");
        }

        const tickets = await response.json();
        const tbody = document.querySelector(".tickets-table tbody");
        tbody.innerHTML = "";

        tickets.forEach(ticket => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${ticket.id}</td>
                <td>${ticket.institucion_nombre}</td>
                <td>${ticket.equipo}</td>
                <td class="status ${ticket.estado}">${ticket.estado}</td>
                <td>${ticket.prioridad}</td>
                <td>${ticket.tecnico_nombre || "—"}</td>
                <td><button class="btn-action">Ver</button></td>
            `;

            tbody.appendChild(row);
        });

    } catch (error) {
        console.error("Error tickets:", error);
    }
}

// ================================
// INIT
// ================================
cargarMetricas();
cargarTickets();
