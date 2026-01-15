const API_BASE_URL = "https://ticket-system-backend-4h25.onrender.com";
const token = localStorage.getItem("copiermaster_token");
const role = localStorage.getItem("copiermaster_role");

if (!token) location.href = "/index.html";

const ticketsBody = document.getElementById("ticketsBody");
const btnNuevoTicket = document.getElementById("btnNuevoTicket");
const modalTicket = document.getElementById("modalTicket");
const modalGestion = document.getElementById("modalGestion");
const cerrarModal = document.getElementById("cerrarModal");
const cerrarGestion = document.getElementById("cerrarGestion");
const ticketForm = document.getElementById("ticketForm");
const userRole = document.getElementById("userRole");
const logoutBtn = document.querySelector(".logout-btn");

let ticketActual = null;

userRole.textContent = role.toUpperCase();

logoutBtn.onclick = () => {
    localStorage.clear();
    location.href = "/index.html";
};

if (role === "tecnico") btnNuevoTicket.style.display = "none";

btnNuevoTicket.onclick = () => modalTicket.classList.remove("hidden");
cerrarModal.onclick = () => modalTicket.classList.add("hidden");
cerrarGestion.onclick = () => modalGestion.classList.add("hidden");

// =====================
// CARGAR TICKETS
// =====================
async function cargarTickets() {
    const res = await fetch(`${API_BASE_URL}/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const tickets = await res.json();
    ticketsBody.innerHTML = "";

    tickets.forEach(t => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${t.id}</td>
            <td>${t.institucion_nombre}</td>
            <td>${t.equipo}</td>
            <td>${t.descripcion}</td>
            <td class="status ${t.estado}">${t.estado}</td>
            <td>${t.prioridad}</td>
            <td>${t.tecnico_nombre || "—"}</td>
            <td>
                ${(role === "admin" || role === "supervisor")
                    ? `<button class="btn-action" onclick="gestionarTicket(${t.id})">Gestionar</button>`
                    : ""}
            </td>
        `;
        ticketsBody.appendChild(tr);
    });
}

// =====================
// CREAR TICKET
// =====================
ticketForm.onsubmit = async e => {
    e.preventDefault();
    await fetch(`${API_BASE_URL}/tickets`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            equipo: equipo.value,
            descripcion: descripcion.value,
            prioridad: prioridad.value
        })
    });
    modalTicket.classList.add("hidden");
    ticketForm.reset();
    cargarTickets();
};

// =====================
// GESTIÓN
// =====================
async function gestionarTicket(id) {
    ticketActual = id;
    modalGestion.classList.remove("hidden");

    const techRes = await fetch(`${API_BASE_URL}/usuarios?rol=tecnico`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const tecnicos = await techRes.json();

    const selectTecnico = document.getElementById("selectTecnico");
    selectTecnico.innerHTML = "<option value=''>Sin asignar</option>";
    tecnicos.forEach(t => {
        selectTecnico.innerHTML += `<option value="${t.id}">${t.nombre}</option>`;
    });
}

document.getElementById("guardarGestion").onclick = async () => {
    await fetch(`${API_BASE_URL}/tickets/${ticketActual}/gestionar`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            tecnico_id: document.getElementById("selectTecnico").value || null,
            estado: document.getElementById("selectEstado").value
        })
    });

    modalGestion.classList.add("hidden");
    cargarTickets();
};

cargarTickets();
