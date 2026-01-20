// ==========================================
// js/dashboard.js - Lógica del Centro de Mando v4.5
// ==========================================

let allTickets = []; // Almacén local de datos
let charts = {}; // Instancias de gráficos

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar Sesión
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
        window.location.href = "index.html";
        return;
    }

    // 2. Cargar Perfil
    loadUserProfile(session.user.id);

    // 3. Configurar Fechas (Mes Actual por defecto)
    setupDateFilters();

    // 4. Cargar Datos
    await fetchData();
});

// --- GESTIÓN DE PERFIL ---
async function loadUserProfile(userId) {
    const { data: profile } = await sb.from('profiles').select('*').eq('id', userId).single();
    if (profile) {
        document.getElementById('userInfo').innerText = profile.full_name || 'Usuario';
        // Mostrar botón de crear solo si es cliente
        if (profile.role === 'client') {
            document.getElementById('btnNewTicket').style.display = 'flex';
        }
    }
}

function setupDateFilters() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    document.getElementById('dateTo').valueAsDate = today;
    document.getElementById('dateFrom').valueAsDate = firstDay;
}

// --- CARGA DE DATOS (SUPABASE) ---
async function fetchData() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px;">Actualizando tablero...</td></tr>';

    try {
        // Traemos tickets con relaciones (Cliente y Técnico)
        // Nota: Ajusta los nombres de tablas si usas 'institutions' o 'profiles'
        const { data, error } = await sb
            .from('tickets')
            .select(`
                *,
                client:client_id(full_name), 
                tech:technician_id(full_name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        allTickets = data || [];
        aplicarFiltros(); // Renderizar todo

    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">Error: ${err.message}</td></tr>`;
    }
}

// --- FILTROS Y RENDERIZADO ---
window.aplicarFiltros = function() {
    const from = document.getElementById('dateFrom').value;
    const to = document.getElementById('dateTo').value;

    // Filtrar por fecha
    const filtered = allTickets.filter(t => {
        const tDate = t.created_at.split('T')[0];
        return tDate >= from && tDate <= to;
    });

    renderKPIs(filtered);
    renderCharts(filtered);
    renderTable(filtered);
};

function renderKPIs(data) {
    const open = data.filter(t => t.status === 'open').length;
    const progress = data.filter(t => t.status === 'in_progress').length;
    const closed = data.filter(t => t.status === 'closed').length;

    // Actualizar números grandes
    document.getElementById('openTickets').innerText = open;
    document.getElementById('inProgress').innerText = progress;
    document.getElementById('closedMonth').innerText = closed;
    
    // Cálculo simple de SLA (Ejemplo)
    document.getElementById('slaRate').innerText = closed > 0 ? "98%" : "--";
}

function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    const count = document.getElementById('recordCount');
    tbody.innerHTML = '';
    count.innerText = `${data.length} registros`;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:#94a3b8;">No hay datos en este rango.</td></tr>';
        return;
    }

    data.forEach(t => {
        // Estilos de estado
        let stClass = 'st-open';
        let stText = 'Abierto';
        if (t.status === 'in_progress') { stClass = 'st-process'; stText = 'En Proceso'; }
        if (t.status === 'closed') { stClass = 'st-closed'; stText = 'Cerrado'; }

        // Nombres (Manejando posibles nulos)
        const clientName = t.client?.full_name || 'Cliente General';
        const techName = t.tech?.full_name || 'Sin Asignar';
        const date = new Date(t.created_at).toLocaleDateString();

        // Botón PDF solo si está cerrado (o siempre, según prefieras)
        let actionBtn = '';
        if (true) { // Mostrar siempre para probar
            // Convertimos el objeto a string seguro para pasarlo a la función
            const safeTicket = encodeURIComponent(JSON.stringify(t));
            actionBtn = `
                <button class="action-icon pdf-icon" onclick="prepararPDF('${safeTicket}')" title="Ver Reporte">
                    <i class="fas fa-file-pdf"></i>
                </button>`;
        }

        const row = `
            <tr>
                <td><strong>#${t.id}</strong></td>
                <td>${date}</td>
                <td>${clientName}</td>
                <td>${t.device_model || '-'}</td>
                <td>${t.issue_description || '-'}</td>
                <td>${techName}</td>
                <td><span class="status-badge ${stClass}">${stText}</span></td>
                <td style="text-align:right;">${actionBtn}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// --- GRÁFICOS (CHART.JS) ---
function renderCharts(data) {
    const ctxOpen = document.getElementById('chartOpen');
    const ctxProg = document.getElementById('chartProgress');
    const ctxClosed = document.getElementById('chartClosed');

    if(!ctxOpen || !ctxProg || !ctxClosed) return; // Protección si no existen

    // Destruir anteriores
    if(charts.open) charts.open.destroy();
    if(charts.prog) charts.prog.destroy();
    if(charts.closed) charts.closed.destroy();

    // Configuración base minimalista
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } }
    };

    // Datos simulados para las mini-gráficas (Sparklines)
    // En producción usarías datos históricos reales
    charts.open = new Chart(ctxOpen, { type: 'line', data: { labels:[1,2,3], datasets:[{data:[5, 8, data.filter(t=>t.status==='open').length], borderColor:'#ef4444', borderWidth:2, tension:0.4, pointRadius:0}] }, options: commonOptions });
    
    charts.prog = new Chart(ctxProg, { type: 'line', data: { labels:[1,2,3], datasets:[{data:[2, 4, data.filter(t=>t.status==='in_progress').length], borderColor:'#f59e0b', borderWidth:2, tension:0.4, pointRadius:0}] }, options: commonOptions });
    
    charts.closed = new Chart(ctxClosed, { type: 'bar', data: { labels:[1,2,3], datasets:[{data:[10, 15, data.filter(t=>t.status==='closed').length], backgroundColor:'#10b981', borderRadius:2}] }, options: commonOptions });
}

// ==========================================
// GENERACIÓN DE PDF "PREMIUM" (EL DELICADO)
// ==========================================

window.prepararPDF = function(encodedTicket) {
    const ticket = JSON.parse(decodeURIComponent(encodedTicket));
    
    // 1. LLENAR DATOS EN LA PLANTILLA OCULTA
    document.getElementById('pdf-id').innerText = "#" + ticket.id;
    document.getElementById('pdf-date').innerText = new Date(ticket.created_at).toLocaleDateString().toUpperCase();
    
    document.getElementById('pdf-client').innerText = (ticket.client?.full_name || "CLIENTE GENERAL").toUpperCase();
    // Podrías agregar RUC si está en la tabla de profiles/institutions
    
    document.getElementById('pdf-device').innerText = (ticket.device_model || "EQUIPO GENÉRICO").toUpperCase();
    // Serie simulada o real
    document.getElementById('pdf-serial').innerText = ticket.serial_number || "SN-PENDIENTE"; 

    // Evidencia (Imagen)
    const img = document.getElementById('pdf-photo');
    if(ticket.evidence_url) {
        img.src = ticket.evidence_url;
    } else {
        // Imagen placeholder limpia
        img.src = "https://via.placeholder.com/600x300/f1f5f9/94a3b8?text=SIN+EVIDENCIA+ADJUNTA";
    }
    document.getElementById('pdf-issue').innerText = `"${ticket.issue_description || 'Sin descripción del problema.'}"`;

    // Datos del Técnico (Banner Azul)
    const techName = ticket.tech?.full_name || "Sin Asignar";
    document.getElementById('pdf-tech').innerText = techName;
    document.getElementById('tech-initial').innerText = techName.charAt(0).toUpperCase();

    // Tiempos (Formato AM/PM)
    const fmtTime = (dateStr) => {
        if(!dateStr) return "--:--";
        return new Date(dateStr).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    };
    
    document.getElementById('pdf-arrival').innerText = fmtTime(ticket.arrival_time);
    document.getElementById('pdf-departure').innerText = fmtTime(ticket.departure_time);
    
    // Duración (Cálculo)
    let duration = "--";
    if(ticket.arrival_time && ticket.departure_time) {
        const diff = new Date(ticket.departure_time) - new Date(ticket.arrival_time);
        const hrs = Math.floor(diff / 3600000);
        const mins = Math.round((diff % 3600000) / 60000);
        duration = `${hrs}h ${mins}m`;
    }
    document.getElementById('pdf-duration').innerText = duration;

    // Solución
    document.getElementById('pdf-solution').innerText = ticket.solution || "Servicio en proceso o sin reporte de cierre.";

    // 2. MOSTRAR Y GENERAR
    const element = document.getElementById('pdf-template-container');
    element.style.display = 'block'; // Hacer visible para el render

    const opt = {
        margin: 0,
        filename: `Reporte_Servicio_${ticket.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        element.style.display = 'none'; // Volver a ocultar
    });
};

// Reporte Consolidado (Tabla Visible)
window.generarReporteConsolidado = function() {
    const element = document.querySelector('.table-wrapper');
    const opt = {
        margin: 10,
        filename: 'Consolidado_Servicios.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(element).save();
};

// Crear Ticket (Cliente)
window.crearTicket = async function(e) {
    e.preventDefault();
    // Lógica de inserción simple para probar
    alert("Funcionalidad de creación en construcción. Conectar con Supabase INSERT.");
    document.getElementById('newTicketModal').style.display = 'none';
};

// Utilidades
window.abrirModalTicket = () => document.getElementById('newTicketModal').style.display = 'flex';
window.logout = async () => { await sb.auth.signOut(); window.location.href = 'index.html'; };
