// =====================================
// TICKETS - COPIERMASTER C&G
// =====================================

const API_BASE_URL = "https://ticket-system-backend-4h25.onrender.com";
const token = localStorage.getItem("copiermaster_token");
const role = localStorage.getItem("copiermaster_role");

// =====================================
// PROTECCIÓN DE SESIÓN
// =====================================
if (!token) {
    window.location.href = "/index.html";
}

// =====================================
// ELEMENTOS DOM
// =====================================
const ticketsBody = document.getElementById("ticketsBody");
const btnNuevoTicket = document.getElementById("btnNuevoTicket");
const modalTicket = document.getElementById("modalTicket");
const cerrarModalBtn = document.getElementById("cerrarModal");
const ticketForm = document.getElementById("ticketForm");
const userRoleSpan = document.getElementById("userRole");
const logoutBtn = document.querySelector(".logout-btn");

// =====================================
// MOSTRAR ROL
// =====================================
userRoleSpan.textContent = role.toUpperCase();

// =====================================
// LOGOUT
// =====================================
logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "/index.html";
});

// =====================================
// CONTROL DE VISIBILIDAD POR ROL
// =====================================
if (role === "tecnico") {
    btnNuevoTicket.style.display = "none";
}

// =====================================
// MODAL
// =====================================
btnNuevoTicket.addEventListener("click", () => {
    modalTicket.classList.remove("hidden");
});

cerrarModalBtn.addEventListener("click", () => {
    modalTicket.classList.add("hidden");
    ticketForm.reset();
});

// =====================================
// CARGAR TICKETS
// =====================================
async function cargarTickets() {
    try {
        const response = await fetch(`${API_BASE_URL}/tickets`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("No se pudieron cargar los tickets");
        }

        const tickets = await response.json();
        ticketsBody.innerHTML = "";

        tickets.forEach(ticket => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${ticket.id}</td>
                <td>${ticket.institucion_nombre}</td>
                <td>${ticket.equipo}</td>
                <td>${ticket.descripcion}</td>
                <td class="status ${ticket.estado}">${ticket.estado}</td>
                <td>${ticket.prioridad}</td>
                <td>${ticket.tecnico_nombre || "—"}</td>
                <td>
                    <button class="btn-action" onclick="verTicket(${ticket.id})">
                        Ver
                    </button>
                </td>
            `;

            ticketsBody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error al cargar tickets:", error);
    }
}

// =====================================
// CREAR TICKET
// =====================================
ticketForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const equipo = document.getElementById("equipo").value.trim();
    const descripcion = document.getElementById("descripcion").value.trim();
    const prioridad = document.getElementById("prioridad").value;

    try {
        const response = await fetch(`${API_BASE_URL}/tickets`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                equipo: equipo,
                descripcion: descripcion,
                prioridad: prioridad
            })
        });

        if (!response.ok) {
            throw new Error("Error al crear ticket");
        }

        modalTicket.classList.add("hidden");
        ticketForm.reset();
        cargarTickets();

    } catch (error) {
        console.error("Error creando ticket:", error);
    }
});

// =====================================
// VER DETALLE TICKET (BASE)
// =====================================
function verTicket(ticketId) {
    alert("Detalle del ticket #" + ticketId + " (siguiente fase)");
}

// =====================================
// INIT
// =====================================
cargarTickets();
