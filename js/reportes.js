const API_BASE_URL = "https://ticket-system-backend-4h25.onrender.com";
const token = localStorage.getItem("copiermaster_token");
const role = localStorage.getItem("copiermaster_role");

if (!token || (role !== "admin" && role !== "supervisor")) {
    location.href = "/index.html";
}

document.getElementById("userRole").textContent = role.toUpperCase();

document.querySelector(".logout-btn").onclick = () => {
    localStorage.clear();
    location.href = "/index.html";
};

const institucionSelect = document.getElementById("institucionSelect");

// =========================
// CARGAR INSTITUCIONES
// =========================
async function cargarInstituciones() {
    const res = await fetch(`${API_BASE_URL}/instituciones`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    institucionSelect.innerHTML = "";
    data.forEach(i => {
        institucionSelect.innerHTML += `<option value="${i.id}">${i.nombre}</option>`;
    });
}

// =========================
// GENERAR REPORTE
// =========================
document.getElementById("btnGenerar").onclick = async () => {
    const institucion = institucionSelect.value;
    const inicio = document.getElementById("fechaInicio").value;
    const fin = document.getElementById("fechaFin").value;

    const res = await fetch(
        `${API_BASE_URL}/tickets/reporte?institucion_id=${institucion}&inicio=${inicio}&fin=${fin}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await res.json();

    document.getElementById("totalTickets").textContent = data.total;
    document.getElementById("abiertos").textContent = data.abiertos;
    document.getElementById("proceso").textContent = data.en_proceso;
    document.getElementById("cerrados").textContent = data.cerrados;
};

// =========================
// DESCARGAS
// =========================
document.getElementById("btnCSV").onclick = () => {
    const i = institucionSelect.value;
    const fi = fechaInicio.value;
    const ff = fechaFin.value;
    window.open(`${API_BASE_URL}/reportes/tickets/csv?institucion_id=${i}&fecha_inicio=${fi}&fecha_fin=${ff}`);
};

document.getElementById("btnPDF").onclick = () => {
    const i = institucionSelect.value;
    const fi = fechaInicio.value;
    const ff = fechaFin.value;
    window.open(`${API_BASE_URL}/reportes/tickets/pdf?institucion_id=${i}&fecha_inicio=${fi}&fecha_fin=${ff}`);
};

cargarInstituciones();
