// ==========================================
// CONFIGURACIÓN E INICIALIZACIÓN
// ==========================================
const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');

// Variables Globales
let allTickets = []; // Aquí guardaremos todos los datos crudos de Supabase
let currentUser = null;
let currentRole = null;
let charts = {}; // Para guardar las instancias de los gráficos y poder actualizarlos

document.addEventListener('DOMContentLoaded', initDashboard);

async function initDashboard() {
    // 1. Verificar Sesión
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
        window.location.href = "index.html";
        return;
    }
    currentUser = session.user;

    // 2. Cargar Perfil y Rol
    await loadUserProfile();

    // 3. Configurar Fechas por Defecto (Mes Actual)
    setupDateFilters();

    // 4. Cargar Datos Reales de Supabase
    await fetchData();
}

// ==========================================
// LÓGICA DE DATOS Y PERFIL
// ==========================================

async function loadUserProfile() {
    try {
        const { data: profile } = await sb.from('profiles').select('*').eq('id', currentUser.id).single();
        
        if (profile) {
            document.getElementById('userName').textContent = profile.full_name;
            currentRole = profile.role;
            
            // UI Específica por Rol
            const badge = document.getElementById('userRoleBadge');
            if(badge) badge.innerText = (profile.role || 'usuario').toUpperCase();

            // Mostrar botón de "Nuevo Ticket" solo si es Cliente
            if (currentRole === 'client') {
                const btn = document.getElementById('btnNewTicket');
                if(btn) btn.style.display = 'inline-flex';
            }
        }
    } catch (err) {
        console.error("Error cargando perfil:", err);
    }
}

function setupDateFilters() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Formatear a YYYY-MM-DD para los inputs HTML
    document.getElementById('dateTo').value = today.toISOString().split('T')[0];
    document.getElementById('dateFrom').value = firstDay.toISOString().split('T')[0];
}

async function fetchData() {
    try {
        // Traemos TODO para filtrar en cliente (Más rápido para < 1000 registros)
        // Nota: Asegúrate de que los nombres de columnas coincidan con tu BD
        let { data, error } = await sb
            .from('tickets')
            .select(`
                id, 
                created_at, 
                status, 
                issue_description, 
                device_model, 
                solution,
                technician_id,
                client_id,
                arrival_time
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Si no hay datos (BD vacía), usamos datos dummy para que veas el diseño
        if (!data || data.length === 0) {
            console.warn("Base de datos vacía, usando datos de prueba...");
            data = generateDummyData(); 
        }

        allTickets = data;
        
        // Renderizar por primera vez
        aplicarFiltros();

    } catch (err) {
        console.error("Error cargando tickets:", err);
        document.getElementById('tableBody').innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">Error de conexión: ${err.message}</td></tr>`;
    }
}

// ==========================================
// LÓGICA DE FILTRADO Y RENDERIZADO
// ==========================================

window.aplicarFiltros = function() {
    const fromDate = document.getElementById('dateFrom').value;
    const toDate = document.getElementById('dateTo').value;

    // 1. Filtrar Array
    const filtered = allTickets.filter(t => {
        const tDate = t.created_at.split('T')[0]; // Asumiendo formato ISO
        return tDate >= fromDate && tDate <= toDate;
    });

    // 2. Actualizar Tabla
    renderTable(filtered);

    // 3. Actualizar KPIs y Gráficos
    updateKPIs(filtered);
    updateCharts(filtered);
};

function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    const counter = document.getElementById('recordCount');
    
    tbody.innerHTML = '';
    if(counter) counter.innerText = `Mostrando ${data.length} registros`;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px;">No se encontraron registros en este periodo.</td></tr>';
        return;
    }

    data.forEach(t => {
        // Definir estilos según estado
        let badgeClass = 'st-open';
        let statusText = 'Abierto';
        if (t.status === 'in_progress') { badgeClass = 'st-process'; statusText = 'En Proceso'; }
        if (t.status === 'closed') { badgeClass = 'st-closed'; statusText = 'Cerrado'; }

        // Acciones disponibles
        let actions = '';
        if (t.status === 'closed') {
            // Pasamos el objeto completo como string al onclick
            const ticketString = JSON.stringify(t).replace(/"/g, '&quot;');
            actions += `<i class="fas fa-file-pdf action-icon pdf-icon" onclick="generarTicketPDF(${ticketString})" title="Ver Reporte PDF"></i>`;
        } else if (currentRole === 'technician') {
            actions += `<i class="fas fa-tools action-icon" title="Atender Ticket (Ir a HelpDesk)"></i>`;
        }

        const dateFormatted = new Date(t.created_at).toLocaleDateString();

        const row = `
            <tr>
                <td><strong>#${t.id.toString().slice(0, 8)}</strong></td>
                <td>${dateFormatted}</td>
                <td>${t.client_id || 'Cliente General'}</td>
                <td>${t.device_model || 'N/A'}</td>
                <td>${t.issue_description}</td>
                <td>${t.technician_id || 'Sin Asignar'}</td>
                <td><span class="status-badge ${badgeClass}">${statusText}</span></td>
                <td style="text-align:right;">${actions}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function updateKPIs(data) {
    // Conteos
    const open = data.filter(t => t.status === 'open').length;
    const process = data.filter(t => t.status === 'in_progress').length;
    const closed = data.filter(t => t.status === 'closed').length;

    // Renderizar
    safeSetText('openTickets', open);
    safeSetText('inProgress', process);
    safeSetText('closedMonth', closed);

    // Calculo SLA (Ejemplo simple)
    // En producción, calcularías (arrival_time - created_at)
    const slaCompliance = closed > 0 ? '98%' : '--'; 
    safeSetText('slaRate', slaCompliance);
}

function safeSetText(id, val) {
    const el = document.getElementById(id);
    if(el) el.textContent = val;
}

// ==========================================
// GRÁFICOS (CHART.JS)
// ==========================================

function updateCharts(data) {
    // Preparar datos
    const open = data.filter(t => t.status === 'open').length;
    const closed = data.filter(t => t.status === 'closed').length;
    
    // Gráfico 1: SLA (Dona)
    renderChart('chartSla', 'doughnut', {
        labels: ['Cumple', 'Fuera de Tiempo'],
        datasets: [{ data: [closed, open], backgroundColor: ['#10b981', '#ef4444'] }]
    });

    // Gráfico 2: Volumen (Barras - Simulado por semana)
    renderChart('chartVol', 'bar', {
        labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
        datasets: [{ label: 'Tickets', data: [5, 8, 2, data.length], backgroundColor: '#3b82f6' }]
    });

    // Gráfico 3: Críticos (Línea)
    renderChart('chartCritical', 'line', {
        labels: ['L', 'M', 'X', 'J', 'V'],
        datasets: [{ label: 'Alta Prioridad', data: [1, 0, 2, 0, 1], borderColor: '#ef4444', tension: 0.4 }]
    });
}

function renderChart(canvasId, type, dataConfig) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    // Destruir gráfico anterior si existe para evitar superposiciones
    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }

    charts[canvasId] = new Chart(ctx, {
        type: type,
        data: dataConfig,
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: { display: false } } 
        }
    });
}

// ==========================================
// GENERACIÓN DE REPORTES PDF
// ==========================================

window.generarTicketPDF = function(ticket) {
    // 1. Llenar plantilla oculta con datos del ticket
    document.getElementById('pdf-id').innerText = "#" + ticket.id.toString().slice(0, 8);
    document.getElementById('pdf-client').innerText = ticket.client_id || "Cliente";
    document.getElementById('pdf-device').innerText = ticket.device_model;
    document.getElementById('pdf-tech').innerText = ticket.technician_id || "Sin Asignar";
    document.getElementById('pdf-date').innerText = new Date(ticket.created_at).toLocaleDateString();
    document.getElementById('pdf-issue').innerText = ticket.issue_description;
    document.getElementById('pdf-solution').innerText = ticket.solution || "Pendiente de cierre técnico.";

    // 2. Generar PDF
    const element = document.getElementById('pdf-content'); // Asegúrate que este ID exista en tu HTML (en el template oculto)
    
    // Mostramos temporalmente el div oculto para que html2pdf pueda renderizarlo
    const container = document.getElementById('pdf-template-container');
    container.style.display = 'block';

    const opt = {
        margin: 10,
        filename: `Ticket_${ticket.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        container.style.display = 'none'; // Volver a ocultar
    });
};

window.generarReporteConsolidado = function() {
    const element = document.querySelector('.table-wrapper');
    const opt = { margin: 10, filename: 'Reporte_Consolidado_Mes.pdf', jsPDF: { orientation: 'landscape' } };
    html2pdf().set(opt).from(element).save();
};

// ==========================================
// UTILIDADES Y LOGOUT
// ==========================================

window.logout = async () => {
    await sb.auth.signOut();
    window.location.href = "index.html";
};

// Datos de prueba por si la BD está vacía (Para que no veas la pantalla en blanco)
function generateDummyData() {
    return [
        {id: '1001-TEST', created_at: '2026-01-15T10:00:00', status: 'closed', client_id: 'RRHH', device_model: 'Ricoh MP 501', issue_description: 'Atasco de papel', solution: 'Limpieza rodillos'},
        {id: '1002-TEST', created_at: '2026-01-18T14:30:00', status: 'in_progress', client_id: 'Contabilidad', device_model: 'Epson WF', issue_description: 'Error de Tinta', solution: ''},
        {id: '1003-TEST', created_at: new Date().toISOString(), status: 'open', client_id: 'Gerencia', device_model: 'Canon IR', issue_description: 'No escanea a carpeta', solution: ''}
    ];
}
