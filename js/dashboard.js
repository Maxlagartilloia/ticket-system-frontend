// js/dashboard.js - Lógica Dashboard v7.5 (Corregido)

let currentUser = null;
let userProfile = null;
let dashboardData = []; // Cache local

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar Sesión
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = session.user;

    // 2. Obtener Perfil
    const { data: profile } = await sb.from('profiles').select('*').eq('id', currentUser.id).single();
    userProfile = profile;

    // 3. Pintar Header
    document.getElementById('userName').innerText = profile.full_name || 'Usuario';
    document.getElementById('userRoleBadge').innerText = profile.role.toUpperCase();

    // 4. Configurar Botón "Solicitar Servicio"
    if(profile.role === 'client') {
        const btn = document.getElementById('btnNewTicket');
        if(btn) btn.style.display = 'inline-flex';
    }

    // 5. Fechas por Defecto (Mes Actual)
    const date = new Date();
    document.getElementById('dateTo').valueAsDate = date;
    document.getElementById('dateFrom').valueAsDate = new Date(date.getFullYear(), date.getMonth(), 1);

    // 6. Cargar Datos Reales
    cargarDatosDashboard();
});

async function cargarDatosDashboard() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin"></i> Cargando datos reales...</td></tr>';

    const fromDate = document.getElementById('dateFrom').value;
    const toDate = document.getElementById('dateTo').value;

    // --- CORRECCIÓN AQUÍ ---
    // Usamos '!technician_id' para decirle a Supabase qué relación usar explícitamente
    let query = sb
        .from('tickets')
        .select(`
            *,
            institutions(name),
            equipment(model),
            technician:profiles!technician_id(full_name) 
        `)
        .gte('created_at', fromDate + 'T00:00:00')
        .lte('created_at', toDate + 'T23:59:59')
        .order('created_at', { ascending: false });

    // Filtros de Seguridad por Rol
    if (userProfile.role === 'client') {
        query = query.eq('institution_id', userProfile.institution_id);
    } else if (userProfile.role === 'technician') {
        query = query.eq('technician_id', userProfile.id);
    }

    const { data, error } = await query;

    if (error) {
        tbody.innerHTML = `<tr><td colspan="8" style="color:red; text-align:center;">Error: ${error.message}</td></tr>`;
        console.error(error);
        return;
    }

    dashboardData = data;
    calcularKPIs(data);
    renderTable(data);
}

function calcularKPIs(data) {
    const open = data.filter(t => t.status === 'open').length;
    const progress = data.filter(t => t.status === 'progress' || t.status === 'in_progress').length;
    const closed = data.filter(t => t.status === 'closed').length;
    const total = data.length;

    document.getElementById('openTickets').innerText = open;
    document.getElementById('inProgress').innerText = progress;
    document.getElementById('closedMonth').innerText = closed;

    const rate = total > 0 ? Math.round((closed / total) * 100) : 0;
    document.getElementById('slaRate').innerText = rate + "%";
}

function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    document.getElementById('recordCount').innerText = `Mostrando ${data.length} registros`;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:#94a3b8;">No hay registros en este periodo.</td></tr>';
        return;
    }

    data.forEach(t => {
        let badgeClass = 'st-open';
        let statusText = 'Abierto';
        if(t.status === 'progress' || t.status === 'in_progress') { badgeClass = 'st-process'; statusText = 'En Proceso'; }
        if(t.status === 'closed') { badgeClass = 'st-closed'; statusText = 'Cerrado'; }

        const clientName = t.institutions ? escapeHTML(t.institutions.name) : '---';
        const deviceName = t.equipment ? escapeHTML(t.equipment.model) : '---';
        const techName = t.technician ? escapeHTML(t.technician.full_name) : 'Sin Asignar';
        const dateStr = new Date(t.created_at).toLocaleDateString();

        let actions = '';
        if(t.status === 'closed') {
            const ticketJson = JSON.stringify(t).replace(/'/g, "&#39;");
            actions = `<i class="fas fa-file-pdf action-icon pdf-icon" onclick='generarTicketPDF(${ticketJson})' title="Ver Reporte"></i>`;
        } else {
            actions = `<span style="color:#cbd5e1; font-size:11px;">Pendiente</span>`;
        }

        const row = `
            <tr>
                <td><strong>#${t.ticket_number}</strong></td>
                <td>${dateStr}</td>
                <td>${clientName}</td>
                <td>${deviceName}</td>
                <td><div style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHTML(t.description)}</div></td>
                <td>${techName}</td>
                <td><span class="status-badge ${badgeClass}">${statusText}</span></td>
                <td style="text-align:right;">${actions}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// ==========================================
// REPORTES
// ==========================================

window.generarTicketPDF = (ticket) => {
    document.getElementById('pdf-id').innerText = "#" + ticket.ticket_number;
    document.getElementById('pdf-client').innerText = ticket.institutions?.name || '-';
    document.getElementById('pdf-device').innerText = ticket.equipment?.model || '-';
    document.getElementById('pdf-tech').innerText = ticket.technician?.full_name || '-';
    document.getElementById('pdf-date').innerText = new Date(ticket.created_at).toLocaleDateString();
    
    document.getElementById('pdf-issue').innerText = ticket.description || '';
    document.getElementById('pdf-solution').innerText = ticket.solution || 'Servicio finalizado correctamente.';

    const element = document.getElementById('pdf-content');
    const opt = { 
        margin: 10, 
        filename: `Ticket_${ticket.ticket_number}.pdf`,
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
    };
    html2pdf().set(opt).from(element).save();
};

window.generarReporteConsolidado = () => {
    const element = document.querySelector('.table-wrapper'); 
    const opt = { 
        margin: 10, 
        filename: 'Reporte_Consolidado.pdf', 
        jsPDF: { orientation: 'landscape' } 
    };
    html2pdf().set(opt).from(element).save();
};

window.logoutSystem = async () => {
    await sb.auth.signOut();
    window.location.href = 'index.html';
};

const escapeHTML = (str) => str ? str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag])) : '';
